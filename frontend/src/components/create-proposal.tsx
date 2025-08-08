import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { web3Enable, web3Accounts, web3FromAddress } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import toast from "react-hot-toast";

const WS_URL = "ws://127.0.0.1:9944";

export default function CreateProposal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await web3Enable("PolkaVault");
      const accounts = await web3Accounts();
      if (!accounts.length) throw new Error("No Polkadot.js accounts found!");

      const account = accounts[0];
      const injector = await web3FromAddress(account.address);
      const api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });

      const tx = api.tx.template.createProposal(title, description, duration);
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
          Create Proposal
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
              required
              variant="outlined"
              color="secondary"
              inputProps={{ min: 10, max: 10000 }}
              error={!!durationError}
              helperText={
                durationError ? "Duration must be between 10 and 10000" : ""
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
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                submitting ||
                !title.trim() ||
                !description.trim() ||
                duration === "" ||
                !!durationError
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
