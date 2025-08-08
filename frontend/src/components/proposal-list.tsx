import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    Grid,
    Stack,
    TextField,
    Tooltip,
    IconButton,
    MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { web3Enable } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { hexToString } from "@polkadot/util";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import toast from "react-hot-toast";

type Proposal = {
    id: number;
    author: string;
    title: string;
    description: string;
    votes_for: number;
    votes_against: number;
    duration: number;
    status: "Active" | "Approved" | "Rejected" | "Cancelled";
};

function ellipsisAddress(addr: string, max = 15) {
    if (!addr || addr.length <= max) return addr;
    const half = Math.floor((max - 3) / 2);
    return `${addr.slice(0, half)}...${addr.slice(-half)}`;
}

const WS_URL = "ws://127.0.0.1:9944";

export default function ProposalList() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [authorFilter, setAuthorFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

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
                        status: value.status,
                        start: value.start,
                    };
                })
            );
            all.sort((a, b) => a.start - b.start);
            setProposals(all);
            setLoading(false);
        })();
        return () => {
            if (api) api.disconnect();
        };
    }, []);

    const handleCopy = (address: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(address);
        toast.success("Copied!");
    };

    const filteredProposals = proposals.filter((p) => {
        const authorMatch = authorFilter
            ? p.author.toLowerCase().includes(authorFilter.toLowerCase())
            : true;
        const statusMatch = statusFilter ? p.status === statusFilter : true;
        return authorMatch && statusMatch;
    });

    return (
        <Box sx={{ mx: "auto", mb: 4, width: "95%", pt: { xs: 7, sm: 8 } }}>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
            >
                <Typography variant="h4" color="secondary">
                    Proposals
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/create-proposal")}
                    sx={{
                        backgroundColor: "primary.main",
                        "&:hover": {
                            backgroundColor: "#FF4AA6",
                        },
                    }}
                >
                    Create Proposal
                </Button>

            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                <TextField
                    label="Filter by Author"
                    value={authorFilter}
                    onChange={e => setAuthorFilter(e.target.value)}
                    size="small"
                    color="secondary"
                    sx={{ minWidth: 200 }}
                />
                <TextField
                    label="Filter by Status"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    select
                    size="small"
                    color="secondary"
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
            </Stack>
            {loading ? (
                <Typography>Loading...</Typography>
            ) : filteredProposals.length === 0 ? (
                <Typography>No proposals found.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {filteredProposals.map((p) => (
                        //@ts-ignore
                        <Grid item xs={12} sm={6} md={4} key={p.id} sx={{ width: 350 }}>
                            <Paper
                                sx={{
                                    p: 2,
                                    cursor: "pointer",
                                    border: "2px solid transparent",
                                    transition: "border-color 150ms ease",
                                    "&:hover": {
                                        borderColor: "#FF4AA6",
                                    },
                                }}
                                onClick={() => navigate(`/proposal/${p.id}`)}
                            >
                                <Typography variant="h5" color="#FF4AA6">
                                    {p.title}
                                </Typography>
                                <Typography variant="h6" color="secondary" sx={{ mt: 1 }}>
                                    {p.description}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ display: "flex", alignItems: "center", mt: 1 }}
                                >
                                    Author:&nbsp;
                                    <span style={{ fontFamily: "monospace" }}>
                                        {ellipsisAddress(p.author, 20)}
                                    </span>
                                    <Tooltip title="Copy address">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleCopy(p.author, e)}
                                        >
                                            <ContentCopyIcon fontSize="inherit" />
                                        </IconButton>
                                    </Tooltip>
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    Votes For: <span style={{ color: '#FF4AA6' }}>{p.votes_for}</span> | Votes Against: <span style={{ color: '#FF4AA6' }}>{p.votes_against}</span>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Duration (in blocks): <span style={{ color: '#FF4AA6' }}>{p.duration}</span>
                                </Typography>
                                <Typography variant="body2" color="#FF4AA6" sx={{ mt: 1 }}>
                                    Status: {p.status}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
