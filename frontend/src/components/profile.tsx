// src/pages/Profile.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Stack, Typography, Button, Table, TableHead, TableRow, TableCell,
  TableBody, TablePagination, Chip, Divider, Tooltip, IconButton
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import toast from "react-hot-toast";

const WS_URL = "ws://127.0.0.1:9944";
const BLOCK_WINDOW = 5000; // koliko blokova unazad skeniramo (po potrebi smanji/povećaj)

type TxRow = {
  block: number;
  kind: "Deposited" | "Withdrawn" | "ProposalCreated" | "ProposalVoted" | "ProposalFinalized" | "VaultSeeded";
  details: string;
};

type ProfileProps = {
  address?: string; // opcionalno, ako želiš da proslediš adresu spolja
};

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

        // 1) Učitaj stake/karma/total
        if (account) {
          const st = await _api.query.template.deposits(account);
          setStake(st.toString());
          const krm = await _api.query.template.karma(account);
          setKarma((krm.toJSON() as number) ?? 0);
        }
        const ts = await _api.query.template.totalStake();
        setTotalStake(ts.toString());

        // 2) Učitaj evente u poslednjih BLOCK_WINDOW blokova
        const head = await _api.rpc.chain.getHeader();
        const current = head.number.toNumber();
        const from = Math.max(1, current - BLOCK_WINDOW + 1);

        const out: TxRow[] = [];
        for (let b = current; b >= from; b--) {
          const hash = await _api.rpc.chain.getBlockHash(b);
          const events = await _api.query.system.events.at(hash);
          //@ts-ignore
          events.forEach((record: any) => {
            const { event } = record;
            const section = event.section as string;  // očekujemo "template"
            const method = event.method as string;

            if (section !== "template") return;

            // Mapiramo tvoje evente iz paleta
            // Event::Deposited { who, amount }
            if (method === "Deposited") {
              const [who, amount] = event.data as unknown as [string, any];
              if (who === account) {
                out.push({ block: b, kind: "Deposited", details: `+ ${amount.toString()}` });
              }
            }

            // Event::Withdrawn { who, amount }
            if (method === "Withdrawn") {
              const [who, amount] = event.data as unknown as [string, any];
              if (who === account) {
                out.push({ block: b, kind: "Withdrawn", details: `- ${amount.toString()}` });
              }
            }

            // Event::ProposalCreated { id, author }
            if (method === "ProposalCreated") {
              const [id, author] = event.data as unknown as [number, string];
              if (author === account) {
                out.push({ block: b, kind: "ProposalCreated", details: `Proposal #${id}` });
              }
            }

            // Event::ProposalVoted { id, voter, vote }
            if (method === "ProposalVoted") {
              const [id, voter, vote] = event.data as unknown as [number, string, any];
              if (voter === account) {
                out.push({ block: b, kind: "ProposalVoted", details: `#${id} → ${vote.toString()}` });
              }
            }

            // Event::ProposalFinalized { id, status }
            if (method === "ProposalFinalized") {
              const [id, status] = event.data as unknown as [number, any];
              out.push({ block: b, kind: "ProposalFinalized", details: `#${id} → ${status.toString()}` });
            }

            // Event::VaultSeeded { coin, amount }
            if (method === "VaultSeeded") {
              const [coin, amount] = event.data as unknown as [any, any];
              out.push({ block: b, kind: "VaultSeeded", details: `${coin.toString()} +${amount.toString()}` });
            }
          });
        }

        // Sortiraj opadajuće po bloku, setuj state
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
