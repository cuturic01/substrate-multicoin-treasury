// src/pages/ProposalDetails.tsx
import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Stack,
    Typography,
    IconButton,
    Tooltip,
    Divider,
    Chip,
    Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useParams } from "react-router-dom";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
import { hexToString } from "@polkadot/util";
import toast from "react-hot-toast";

type ProposalOnChain = {
    author: string;
    title: string;
    description: string;
    forVotes: number;
    againstVotes: number;
    start: number;
    end: number;
    status: "Active" | "Approved" | "Rejected" | "Cancelled";
};

const WS_URL = "ws://127.0.0.1:9944";

export default function ProposalDetails() {
    const { id } = useParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [currentBlock, setCurrentBlock] = useState<number | null>(null);
    const [data, setData] = useState<ProposalOnChain | null>(null);

    const numericId = useMemo(() => Number(id), [id]);

    useEffect(() => {
        let mounted = true;
        let _api: ApiPromise;

        (async () => {
            try {
                await web3Enable("PolkaVault");
                _api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });
                if (!mounted) return;

                const raw = await _api.query.template.proposals(numericId);
                const json = raw.toJSON() as any;

                if (!json || !json.author) {
                    toast.error("Proposal not found");
                    setLoading(false);
                    return;
                }

                setData({
                    author: json.author,
                    title: hexToString(json.title),
                    description: hexToString(json.description),
                    forVotes: json.forVotes ?? 0,
                    againstVotes: json.againstVotes ?? 0,
                    start: json.start,
                    end: json.end,
                    status: json.status,
                });

                const unsub = await _api.rpc.chain.subscribeNewHeads((h) => {
                    setCurrentBlock(h.number.toNumber());
                });

                setLoading(false);

                return () => {
                    unsub && unsub();
                };
            } catch (e: any) {
                toast.error(e?.message || "Failed to load proposal");
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
            if (_api) _api.disconnect().catch(() => undefined);
        };
    }, [numericId]);

    const blocksTotal = data ? data.end - data.start : null;

    const statusColor =
        data?.status === "Active"
            ? "warning"
            : data?.status === "Approved"
                ? "success"
                : data?.status === "Rejected"
                    ? "error"
                    : "default";

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied!");
    };

    if (loading) {
        return (
            <Box sx={{ maxWidth: 900, mx: "auto" }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ maxWidth: 900, mx: "auto" }}>
                <Typography sx={{ mt: 2 }}>Proposal not found.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900, mx: "auto", mb: 6, mt: 2 }}>
            <Stack direction="row" justifyContent="flex-end" mb={2}>
                <Chip
                    label={`Status: ${data.status}`}
                    color={statusColor as any}
                    variant="outlined"
                />
            </Stack>

            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h5" color="secondary">
                            {data.title}
                        </Typography>
                        {data.status === "Active" && (
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={async () => {
                                    try {
                                        await web3Enable("PolkaVault");
                                        const accounts = await web3Accounts();
                                        if (!accounts.length) throw new Error("No Polkadot.js accounts found!");
                                        const account = accounts[0];
                                        const injector = await web3FromAddress(account.address);
                                        const api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });
                                        const tx = api.tx.template.finalizeProposal(Number(id));
                                        await tx.signAndSend(account.address, { signer: injector.signer }, ({ status, dispatchError }) => {
                                            if (dispatchError) {
                                                toast.error("Transaction failed");
                                            }
                                            if (status.isInBlock || status.isFinalized) {
                                                toast.success("Proposal finalized!");
                                                window.location.reload();
                                            }
                                        });
                                    } catch (err: any) {
                                        toast.error(err.message || "Error finalizing proposal");
                                    }
                                }}
                            >
                                Finalize
                            </Button>
                        )}
                    </Stack>

                    <Typography variant="h6" color="#FF4AA6">
                        Description
                    </Typography>
                    <Typography variant="body1">{data.description}</Typography>

                    <Divider />

                    <Typography variant="h6" color="#FF4AA6">
                        Author
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                            {data.author}
                        </Typography>
                        <Tooltip title="Copy address">
                            <IconButton size="small" onClick={() => handleCopy(data.author)}>
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Divider />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                        <Paper sx={{ p: 2, flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Votes For
                            </Typography>
                            <Typography variant="h5" color="secondary">
                                {data.forVotes}
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Votes Against
                            </Typography>
                            <Typography variant="h5" color="secondary">
                                {data.againstVotes}
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Duration (blocks)
                            </Typography>
                            <Typography variant="h5" color="secondary">
                                {blocksTotal}
                            </Typography>
                        </Paper>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                        <Paper sx={{ p: 2, flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Start Block
                            </Typography>
                            <Typography variant="h6">{data.start}</Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                End Block
                            </Typography>
                            <Typography variant="h6">{data.end}</Typography>
                        </Paper>
                        <Paper sx={{ p: 2, flex: 1, minWidth: 220 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Current Block
                            </Typography>
                            <Typography variant="h6">{currentBlock ?? "…"}</Typography>
                        </Paper>
                    </Stack>
                </Stack>
            </Paper>
        </Box>
    );
}
