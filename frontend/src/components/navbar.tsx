import {
	AppBar,
	Box,
	Button,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
	useTheme,
	useMediaQuery,
  } from "@mui/material";
  import { Outlet, useNavigate } from "react-router-dom";
  import { CallMade, Menu, Person, AccountBalanceWallet } from "@mui/icons-material";
  import { RiContractFill } from "react-icons/ri";
  import { useState } from "react";
  import StakeDialog from "./stake-pop-up";
  import { web3Accounts, web3Enable, web3FromAddress } from "@polkadot/extension-dapp";
  import { ApiPromise, WsProvider } from "@polkadot/api";
  import toast from "react-hot-toast";
  
  const WS_URL = "ws://127.0.0.1:9944";
  
  export default function Navbar() {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [stakeOpen, setStakeOpen] = useState(false);
  
	const navItems = [
	  { label: "Stake", icon: <CallMade />, path: "/stake", type: "action" as const },
	  { label: "Portfolio", icon: <AccountBalanceWallet />, path: "/portfolio", type: "route" as const },
	  { label: "Proposals", icon: <RiContractFill />, path: "/", type: "route" as const },
	  { label: "Profile", icon: <Person />, path: "/profile", type: "route" as const },
	];
  
	const handleNavClick = (item: (typeof navItems)[number]) => {
	  if (item.type === "action" && item.label === "Stake") {
		setStakeOpen(true);
	  } else {
		navigate(item.path);
	  }
	};
  
	return (
	  <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
		<AppBar position="relative" sx={{ flex: "0 1 auto" }}>
		  <Toolbar
			sx={{
			  minHeight: "64px",
			  px: 2,
			  display: "flex",
			  alignItems: "center",
			}}
		  >
			{/* Logo levo */}
			<Box
			  onClick={() => navigate("/")}
			  sx={{
				display: "flex",
				alignItems: "center",
				cursor: "pointer",
				gap: 1,
				flex: "1 1 0%",
			  }}
			>
			  <img
				src="/logo-light-navbar.png"
				alt="PolkaDAO Logo"
				style={{ height: 40, width: "auto" }}
			  />
			  <Typography variant="h6" sx={{ color: "#FFFFFF" }}>
				PolkaVault
			  </Typography>
			</Box>
  
			{/* Centralni meni */}
			<Box
			  sx={{
				display: { xs: "none", md: "flex" },
				gap: 3,
				justifyContent: "center",
				alignItems: "center",
				flex: "1 1 0%",
			  }}
			>
			  {navItems.map((item) => (
				<Button
				  key={item.label}
				  startIcon={item.icon}
				  onClick={() => handleNavClick(item)}
				  sx={{ color: "#F5F5F5", textTransform: "capitalize" }}
				>
				  {item.label}
				</Button>
			  ))}
			</Box>
  
			{/* Desno: burger na mobilu */}
			<Box sx={{ flex: "1 1 0%", display: "flex", justifyContent: "flex-end" }}>
			  {isMobile && (
				<IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
				  <Menu />
				</IconButton>
			  )}
			</Box>
		  </Toolbar>
		</AppBar>
  
		{/* Drawer za mobile */}
		<Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
		  <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
			<List>
			  {navItems.map((item) => (
				// @ts-ignore
				<ListItem
				  button
				  key={item.label}
				  // @ts-ignore
				  onClick={(e) => {
					e.stopPropagation();
					setDrawerOpen(false);
					handleNavClick(item);
				  }}
				>
				  <ListItemIcon>{item.icon}</ListItemIcon>
				  <ListItemText primary={item.label} />
				</ListItem>
			  ))}
			</List>
		  </Box>
		</Drawer>
  
		{/* Stake popup */}
		<StakeDialog
		  open={stakeOpen}
		  onClose={() => setStakeOpen(false)}
		  onConfirm={async (amount) => {
			try {
			  await web3Enable("PolkaVault");
			  const accounts = await web3Accounts();
			  if (!accounts.length) throw new Error("No Polkadot.js accounts found!");
  
			  const account = accounts[0];
			  const injector = await web3FromAddress(account.address);
			  const api = await ApiPromise.create({ provider: new WsProvider(WS_URL) });
  
			  const tx = api.tx.template.deposit(amount);
			  await tx.signAndSend(
				account.address,
				{ signer: injector.signer },
				({ status, dispatchError }) => {
				  if (dispatchError) {
					toast.error("Transaction failed");
				  }
				  if (status.isInBlock || status.isFinalized) {
					toast.success("Stake deposited!");
				  }
				}
			  );
			} catch (err: any) {
			  toast.error(err.message || "Error creating stake");
			}
			setStakeOpen(false);
		  }}
		  title="Stake amount"
		/>
  
		<div id="detail" style={{ flex: "1 1 auto", width: "100%" }}>
		  <Outlet />
		</div>
	  </Box>
	);
  }
  