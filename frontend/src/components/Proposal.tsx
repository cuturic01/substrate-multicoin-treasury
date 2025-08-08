import { useEffect, useState } from "react";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { web3Enable } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString } from '@polkadot/util';

type Proposal = {
    id: number;
    author: string;
    title: string;
    description: string;
    votes_for: number;
    votes_against: number;
    duration: number;
    status: 'Active' | 'Approved' | 'Rejected' | 'Cancelled';
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
                        author: value.author,
                        title: hexToString(value.title),
                        description: hexToString(value.description),
                        votes_for: value.forVotes ?? 0,
                        votes_against: value.againstVotes ?? 0,
                        duration: value.end - value.start,
                        status: value.status
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
        <Box sx={{ maxWidth: 700, mx: "auto", mt: 4, mb: 4, width: "95%", pt: { xs: 7, sm: 8 } }}>
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
                                Creator: {p.author}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Votes For: {p.votes_for} | Votes Against: {p.votes_against}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Duration (in blocks): {p.duration}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Status: {p.status}
                            </Typography>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
}