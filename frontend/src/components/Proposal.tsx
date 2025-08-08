import { useEffect, useState } from "react";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { web3Enable } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";

type Proposal = {
    id: number;
    creator: string;
    title: string;
    description: string;
    votes_for: number;
    votes_against: number;
};

const WS_URL = "ws://127.0.0.1:9944";

export default function ProposalList() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let api: ApiPromise;
        (async () => {
            await web3Enable("PolkaVault");
            api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });
            const keys = await api.query.template.proposals.keys();
            const all = await Promise.all(
                keys.map(async (k: any) => {
                    const id = k.args[0].toNumber();

                    const data = await api.query.template.proposals(id);
                    const value = data.toJSON() as any;
                    return {
                        id,
                        creator: value.creator,
                        title: value.title ? Buffer.from(value.title).toString("utf-8") : "",
                        description: value.description ? Buffer.from(value.description).toString("utf-8") : "",
                        votes_for: value.votes_for,
                        votes_against: value.votes_against,
                        duration: value.duration,
                    };
                })
            );
            setProposals(all);
            setLoading(false);
        })();
        return () => {
            if (api) api.disconnect();
        };
    }, []);

    return (
        <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" color="secondary">Proposals</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/create-proposal")}
                >
                    Create Proposal
                </Button>
            </Stack>
            {loading ? (
                <Typography>Loading...</Typography>
            ) : proposals.length === 0 ? (
                <Typography>No proposals yet.</Typography>
            ) : (
                <Stack spacing={2}>
                    {proposals.map((p) => (
                        <Paper key={p.id} sx={{ p: 2 }}>
                            <Typography variant="h6" color="secondary">{p.title} - {p.description}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Creator: {p.creator}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Votes For: {p.votes_for} | Votes Against: {p.votes_against}
                            </Typography>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}