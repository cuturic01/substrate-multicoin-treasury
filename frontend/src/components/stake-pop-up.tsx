// src/components/StakeDialog.tsx
import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Stack,
    Button,
    Typography,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";

type StakeDialogProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void; // vrati pozitivan broj
    initialAmount?: number;
    title?: string;
};

const validationSchema = Yup.object({
    amount: Yup.number()
        .typeError("Amount")
        .positive("Must be a positive number")
        .required("Required"),
});

export default function StakeDialog({
    open,
    onClose,
    onConfirm,
    initialAmount = 0,
    title = "Stake amount",
}: StakeDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Typography variant="h6" color="secondary">{title}</Typography>
            </DialogTitle>

            <Formik
                initialValues={{ amount: initialAmount || "" }}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                    onConfirm(Number(values.amount));
                }}
                validateOnMount
            >
                {({ values, errors, touched, handleChange, handleBlur, isValid, isSubmitting }) => (
                    <Form>
                        <DialogContent>
                            <TextField
                                fullWidth
                                label="Amount"
                                name="amount"
                                type="number"
                                value={values.amount}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                inputProps={{ min: 0, step: "any" }}
                                error={touched.amount && Boolean(errors.amount)}
                                color="secondary"
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

                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={onClose}
                                    sx={{
                                        flex: 1,
                                        borderColor: (theme) => theme.palette.grey[400],
                                        color: (theme) => theme.palette.grey[700],
                                        "&:hover": {
                                            borderColor: (theme) => theme.palette.grey[500],
                                            backgroundColor: (theme) => theme.palette.grey[100],
                                        },
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={!isValid || isSubmitting}
                                    sx={{
                                        flex: 1,
                                        backgroundColor: "#FF4AA6", // roze confirm
                                        "&:hover": { backgroundColor: "#E6007A" },
                                    }}
                                >
                                    Confirm
                                </Button>
                            </Stack>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}
