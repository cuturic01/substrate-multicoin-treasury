// src/pages/Profile.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Stack, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, TablePagination, Chip, Divider, Tooltip, IconButton
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import toast from "react-hot-toast";
import { decodeAddress } from "@polkadot/util-crypto";
import { u8aEq } from "@polkadot/util";

const WS_URL = "ws://127.0.0.1:9944";

type TxRow = {
  block: number;
  kind: "Deposited" | "Withdrawn" | "ProposalCreated" | "ProposalVoted" | "ProposalFinalized" | "VaultSeeded";
  details: string;
};

type ProfileProps = {
  address?: string;
};

// ---- helpers ----
function sameAccount(a?: string | Uint8Array | null, b?: string | Uint8Array | null) {
  if (!a || !b) return false;
  try {
    const da = typeof a === "string" ? decodeAddress(a) : a;
    const db = typeof b === "string" ? decodeAddress(b) : b;
    return u8aEq(da, db);
  } catch {
    return String(a) === String(b);
  }
}

function formatBal(x: any) {
  try { return x.toString(); } catch { return String(x); }
}

function voteToString(v: any) {
  const j = v?.toJSON?.() ?? v;
  if (typeof j === "string") return j;
  if (j && typeof j === "object") return Object.keys(j)[0] ?? String(v);
  return String(v);
}

export default function Profile({ address }: ProfileProps) {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [account, setAccount] = useState<string | null>(address ?? null);
  const [loading, setLoading] = useState(true);

  const [stake, setStake] = useState<string>("0");
  const [karma, setKarma] = useState<number>(0);
  const [totalStake, setTotalStake] = useState<string>("0");

  const [rows, setRows] = useState<TxRow[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRpp] = useState(10);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  useEffect(() => {
    let mounted = true;
    let _api: ApiPromise;

    (async () => {
      try {
        await web3Enable("PolkaVault");
        if (!account) {
          const accs = await web3Accounts();
          if (!accs.length) {
            toast.error("No Polkadot.js accounts found");
            setLoading(false);
            return;
          }
          setAccount(accs[0].address);
        }

        _api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });
        if (!mounted) return;
        setApi(_api);

        // 1) Profil info
        if (account) {
          const st = await _api.query.template.deposits(account);
          setStake(st.toString());
          const krm = await _api.query.template.karma(account);
          setKarma((krm.toJSON() as number) ?? 0);
        }
        const ts = await _api.query.template.totalStake();
        setTotalStake(ts.toString());

        // 2) Transakcije/eventi – dinamički window po blockHashCount
        const head = await _api.rpc.chain.getHeader();
        const current = head.number.toNumber();

        // koliki opseg čvor garantuje u memoriji
        const maxHashes = _api.consts.system?.blockHashCount?.toNumber?.() ?? 256;
        // idi manje od blockHashCount; i ograniči na npr. 2000
        const WINDOW = Math.min(2000, Math.max(1, maxHashes - 2));
        const from = Math.max(1, current - WINDOW + 1);

        const out: TxRow[] = [];
        for (let b = current; b >= from; b--) {
          const hash = await _api.rpc.chain.getBlockHash(b);
          try {
            const events = await _api.query.system.events.at(hash);
            const evs = (_api.events as any) ?? {};

            events.forEach((record: any) => {
              const ev = record.event;

              // Deposited(who, amount)
              if (evs?.template?.Deposited?.is?.(ev)) {
                const [who, amount] = ev.data as unknown as [any, any];
                if (sameAccount(who?.toString?.(), account)) {
                  out.push({ block: b, kind: "Deposited", details: `+ ${formatBal(amount)}` });
                }
                return;
              }

              // Withdrawn(who, amount)
              if (evs?.template?.Withdrawn?.is?.(ev)) {
                const [who, amount] = ev.data as unknown as [any, any];
                if (sameAccount(who?.toString?.(), account)) {
                  out.push({ block: b, kind: "Withdrawn", details: `- ${formatBal(amount)}` });
                }
                return;
              }

              // ProposalCreated(id, author)
              if (evs?.template?.ProposalCreated?.is?.(ev)) {
                const [id, author] = ev.data as unknown as [any, any];
                if (sameAccount(author?.toString?.(), account)) {
                  out.push({ block: b, kind: "ProposalCreated", details: `Proposal #${id.toString()}` });
                }
                return;
              }

              // ProposalVoted(id, voter, vote)
              if (evs?.template?.ProposalVoted?.is?.(ev)) {
                const [id, voter, vote] = ev.data as unknown as [any, any, any];
                if (sameAccount(voter?.toString?.(), account)) {
                  out.push({ block: b, kind: "ProposalVoted", details: `#${id.toString()} → ${voteToString(vote)}` });
                }
                return;
              }

              // ProposalFinalized(id, status) – global
              if (evs?.template?.ProposalFinalized?.is?.(ev)) {
                const [id, status] = ev.data as unknown as [any, any];
                out.push({ block: b, kind: "ProposalFinalized", details: `#${id.toString()} → ${status.toString()}` });
                return;
              }

              // VaultSeeded(coin, amount) – global
              if (evs?.template?.VaultSeeded?.is?.(ev)) {
                const [coin, amount] = ev.data as unknown as [any, any];
                out.push({ block: b, kind: "VaultSeeded", details: `${coin.toString()} +${formatBal(amount)}` });
                return;
              }

              // Fallback ako se ime palete razlikuje (npr. "templateModule")
              // if ((ev.section === "template" || ev.section === "templateModule") && ev.method === "Deposited") { ... }
            });
          } catch (e: any) {
            // najverovatnije pruned state za taj blok → prekini skeniranje dalje unazad
            console.warn("Skipped pruned block", b, e?.message);
            break;
          }
        }

        out.sort((a, b) => b.block - a.block);
        setRows(out);
        setLoading(false);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load profile");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (_api) _api.disconnect().catch(() => undefined);
    };
  }, [account]);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied!");
  };

  return (
    <Box sx={{ mx: "auto", mb: 4, width: "95%", pt: { xs: 7, sm: 8 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" color="secondary">Profile</Typography>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <Paper sx={{ p: 2, flex: 1, minWidth: 260 }}>
          <Typography variant="subtitle2" color="text.secondary">Address</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body1" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
              {account || "—"}
            </Typography>
            {account && (
              <Tooltip title="Copy address">
                <IconButton size="small" onClick={() => copy(account!)}>
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">Stake</Typography>
          <Typography variant="h5" color="secondary">{stake}</Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">Karma</Typography>
          <Typography variant="h5" color="secondary">{karma}</Typography>
        </Paper>

        <Paper sx={{ p: 2, flex: 1, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">Total Stake (global)</Typography>
          <Typography variant="h6">{totalStake}</Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" color="#FF4AA6">Transactions</Typography>
          <Chip label={loading ? "Loading..." : `${rows.length} items`} variant="outlined" />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Typography>Loading...</Typography>
        ) : rows.length === 0 ? (
          <Typography>No transactions found.</Typography>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Block</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((r, i) => (
                  <TableRow key={`${r.block}-${r.kind}-${i}`}>
                    <TableCell>{r.block}</TableCell>
                    <TableCell>
                      <Chip
                        label={r.kind}
                        variant="outlined"
                        color={
                          r.kind === "Deposited"
                            ? "success"
                            : r.kind === "Withdrawn"
                            ? "warning"
                            : r.kind === "ProposalFinalized"
                            ? "primary"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>{r.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRpp(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
