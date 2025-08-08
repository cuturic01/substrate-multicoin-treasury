import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import toast from "react-hot-toast";

const WS_URL = "ws://127.0.0.1:9944";

const COINS = [
  { value: "Dot", label: "DOT" },
  { value: "Kusama", label: "KSM" },
  { value: "Usdc", label: "USDC" },
  { value: "Centrifuge", label: "Centrifuge" },
];

export default function CreateProposal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [fromCoin, setFromCoin] = useState(COINS[0].value);
  const [toCoin, setToCoin] = useState(COINS[1].value);
  const [amount, setAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (fromCoin === toCoin) {
      toast.error("Cannot swap to the same coin!");
      setSubmitting(false);
      return;
    }

    try {
      await web3Enable("PolkaVault");
      const accounts = await web3Accounts();
      if (!accounts.length) throw new Error("No Polkadot.js accounts found!");

      const account = accounts[0];
      const injector = await web3FromAddress(account.address);
      const api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });

      // Action::Swap(Swap { from, to, amount })
      const swap = { from: fromCoin, to: toCoin, amount: amount };
      // Action enum as { Swap: swap }
      const action = { Swap: swap };

      // title, description: string -> Vec<u8>
      // duration: number
      // action: Action
      const tx = api.tx.template.createProposal(
        [...new TextEncoder().encode(title)],
        [...new TextEncoder().encode(description)],
        duration,
        action
      );
      await tx.signAndSend(
        account.address,
        { signer: injector.signer },
        ({ status, dispatchError }) => {
          if (dispatchError) {
            toast.error("Transaction failed");
            setSubmitting(false);
          }
          if (status.isInBlock || status.isFinalized) {
            toast.success("Proposal created!");
            setSubmitting(false);
            navigate("/");
          }
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Error creating proposal");
      setSubmitting(false);
    }
  };

  const durationError =
    duration !== "" && (Number(duration) < 10 || Number(duration) > 10000);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" color="secondary" mb={2}>
          Create Swap Proposal
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              variant="outlined"
              color="secondary"
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              minRows={3}
              variant="outlined"
              color="secondary"
            />
            <TextField
              label="Duration (blocks)"
              type="number"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value === "" ? "" : Number(e.target.value))
              }
              sx={{
                "& input[type=number]": {
                  MozAppearance: "textfield", // Firefox
                },
                "& input[type=number]::-webkit-outer-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
                "& input[type=number]::-webkit-inner-spin-button": {
                  WebkitAppearance: "none",
                  margin: 0,
                },
              }}
              required
              variant="outlined"
              color="secondary"
              inputProps={{ min: 10, max: 10000 }}
              error={!!durationError}
              helperText={
                durationError ? "Duration must be between 10 and 10000" : ""
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="From Coin"
                value={fromCoin}
                color="secondary"
                onChange={e => setFromCoin(e.target.value)}
                required
                sx={{ flex: 1 }}
              >
                {COINS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="To Coin"
                value={toCoin}
                color="secondary"
                onChange={e => setToCoin(e.target.value)}
                required
                sx={{ flex: 1 }}
              >
                {COINS.filter(c => c.value !== fromCoin).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                color="secondary"
                onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                required
                sx={{
                  flex: 1,
                  "& input[type=number]": {
                    MozAppearance: "textfield", // Firefox
                  },
                  "& input[type=number]::-webkit-outer-spin-button": {
                    WebkitAppearance: "none",
                    margin: 0,
                  },
                  "& input[type=number]::-webkit-inner-spin-button": {
                    WebkitAppearance: "none",
                    margin: 0,
                  },
                }}
                inputProps={{ min: 1 }}
              />
            </Stack>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                submitting ||
                !title.trim() ||
                !description.trim() ||
                duration === "" ||
                !!durationError ||
                amount === "" ||
                fromCoin === toCoin
              }
            >
              {submitting ? "Submitting..." : "Create"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}