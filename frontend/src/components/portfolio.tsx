// src/pages/Portfolio.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Stack, Typography, Chip, Grid } from "@mui/material";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { web3Enable } from "@polkadot/extension-dapp";
import toast from "react-hot-toast";
import { ResponsivePie, type PieSvgProps } from "@nivo/pie";

const WS_URL = "ws://127.0.0.1:9944";

type Coin = "Dot" | "Kusama" | "Usdc" | "Centrifuge";
type Slice = { name: Coin; value: number; color: string; pct?: number };

const COIN_COLORS: Record<Coin, string> = {
  Dot: "#E6007A",
  Kusama: "#9E9E9E",
  Usdc: "#2775CA",
  Centrifuge: "#F5A800",
};

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const pf = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 });
const fmtNum = (n: number) => nf.format(n);

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [slices, setSlices] = useState<Slice[]>([]);
  const apiRef = useRef<ApiPromise | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await web3Enable("PolkaVault");
        const api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });
        apiRef.current = api;

        const entries = await api.query.template.vault.entries();
        const INDEX_TO_COIN = ["Dot", "Kusama", "Usdc", "Centrifuge"] as const;

        const balances = new Map<Coin, number>([
          ["Dot", 0],
          ["Kusama", 0],
          ["Usdc", 0],
          ["Centrifuge", 0],
        ]);

        for (const [key, val] of entries) {
          const rawKey = key.args[0]?.toJSON();
          let coinName: Coin | null = null;

          if (typeof rawKey === "string") {
            coinName = rawKey as Coin;
          } else if (typeof rawKey === "number") {
            coinName = INDEX_TO_COIN[rawKey] as Coin;
          } else if (rawKey && typeof rawKey === "object") {
            const variant = Object.keys(rawKey)[0];
            coinName = variant as Coin;
          }
          if (!coinName) continue;

          const bn = val.toBigInt ? (val.toBigInt() as unknown as bigint) : BigInt(val.toString());
          const num = Number(bn);
          if (Number.isFinite(num) && num > 0) {
            balances.set(coinName, num);
          }
        }

        if (cancelled) return;

        const arr = (Array.from(balances.entries()) as [Coin, number][])
          .filter(([, v]) => v > 0)
          .sort((a, b) => b[1] - a[1]);

        const totalVal = arr.reduce((acc, [, v]) => acc + v, 0);
        const data: Slice[] = arr.map(([coin, value]) => ({
          name: coin,
          value,
          color: COIN_COLORS[coin],
          pct: totalVal > 0 ? value / totalVal : 0,
        }));

        setSlices(data);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Failed to load portfolio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (apiRef.current) {
        apiRef.current.disconnect().catch(() => undefined);
        apiRef.current = null;
      }
    };
  }, []);

  const total = useMemo(() => slices.reduce((acc, s) => acc + s.value, 0), [slices]);

  const nivoData = useMemo(
    () =>
      slices.map((s) => ({
        id: s.name,
        label: s.name,
        value: s.value,
        color: s.color,
        pct: s.pct,
      })),
    [slices]
  );

  // Removed CenterMetric layer to remove total inside chart

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pt: 1,
        px: 2,
      }}
    >
      <Paper
        sx={{
          p: 2,
          borderRadius: 3,
          boxShadow: "0px 4px 16px rgba(0,0,0,0.06)",
          width: { xs: 360, sm: 420 },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5" color="secondary">
            Portfolio
          </Typography>
          <Chip label={loading ? "Loading..." : ""} variant="outlined" size="small" />
        </Stack>

        {loading ? (
          <Typography sx={{ textAlign: "center", py: 6 }}>Loading...</Typography>
        ) : nivoData.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 6 }}>No assets in vault yet.</Typography>
        ) : (
          <>
            <Box sx={{ height: 280 }}>
              <ResponsivePie
                data={nivoData}
                innerRadius={0.7}
                padAngle={2}
                cornerRadius={6}
                activeOuterRadiusOffset={8}
                colors={{ datum: "data.color" }}
                enableArcLabels={false}
                enableArcLinkLabels={false}
                arcBorderWidth={1}
                arcBorderColor={{ from: "color", modifiers: [["darker", 0.4]] }}
                startAngle={90}
                endAngle={-270}
                sortByValue={true}
                motionConfig="stiff"
                tooltip={({ datum }) => (
                  <Box sx={{ px: 1, py: 0.5 }}>
                    <Typography variant="body2">
                      {datum.id as string}: {fmtNum(datum.value as number)}
                      {typeof (datum.data as any).pct === "number"
                        ? ` (${pf.format((datum.data as any).pct)})`
                        : ""}
                    </Typography>
                  </Box>
                )}
                legends={[]} // Remove internal legends, we create a separate legend
              />
            </Box>

            {/* New separate legend container */}
            <Box sx={{ mt: 2, px: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Breakdown by Token (%)
              </Typography>
              <Grid container spacing={1}>
                {slices.map(({ name, color, pct }) => (
                  <Grid
                    item
                    key={name}
                    xs={6}
                    sm={4}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        bgcolor: color,
                        borderRadius: 0.5,
                      }}
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", minWidth: 40, textAlign: "right" }}
                    >
                      {pct !== undefined ? pf.format(pct) : "-"}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
