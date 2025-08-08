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
  import { CallMade, Logout, Menu, History, Person } from "@mui/icons-material";
  import { RiContractFill } from "react-icons/ri";
  import { useState } from "react";
  import StakeDialog from "./stake-pop-up"; 
  
  export default function Navbar() {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [stakeOpen, setStakeOpen] = useState(false);
  
	const navItems = [
	  { label: "Deposit", icon: <CallMade />, path: "/deposit", type: "action" as const },
	  { label: "Proposals", icon: <RiContractFill />, path: "/", type: "route" as const },
	  { label: "History", icon: <History />, path: "/history", type: "route" as const },
	  { label: "Profile", icon: <Person />, path: "/profile", type: "route" as const },
	];
  
	const handleNavClick = (item: (typeof navItems)[number]) => {
	  if (item.type === "action" && item.label === "Deposit") {
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
			  justifyContent: "space-between",
			}}
		  >
			<Box
			  onClick={() => navigate("/")}
			  sx={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 1, flex: "1 1 0%" }}
			>
			  <img src="/logo-light-navbar.png" alt="PolkaDAO Logo" style={{ height: 40, width: "auto" }} />
			  <Typography variant="h6" sx={{ color: "#FFFFFF" }}>
				PolkaVault
			  </Typography>
			</Box>
  
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
  
			<Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", flex: "1 1 0%" }}>
			  {isMobile ? (
				<IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
				  <Menu />
				</IconButton>
			  ) : (
				<Button startIcon={<Logout />} sx={{ color: "#F5F5F5", textTransform: "capitalize" }}>
				  Logout
				</Button>
			  )}
			</Box>
		  </Toolbar>
		</AppBar>
  
		<Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
		  <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
			<List>
			  {navItems.map((item) => (
				// @ts-ignore
				<ListItem
				  button
				  key={item.label}
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
			  {/* @ts-ignore */}
			  <ListItem button>
				<ListItemIcon>
				  <Logout />
				</ListItemIcon>
				<ListItemText primary="Logout" />
			  </ListItem>
			</List>
		  </Box>
		</Drawer>
  
		{/* Popup za stake */}
		<StakeDialog
		  open={stakeOpen}
		  onClose={() => setStakeOpen(false)}
		  onConfirm={(amount) => {
			// TODO: implementirati stake tx kasnije
			// za sada samo zatvaramo
			console.log("Stake amount:", amount);
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
  