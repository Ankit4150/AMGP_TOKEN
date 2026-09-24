export const adminStats=[
{label:"Total Users",value:"2,548",change:"12%",tone:"blue",direction:"up",icon:"users"},
{label:"Active Users",value:"2,140",change:"9%",tone:"green",direction:"up",icon:"activeUsers"},
{label:"Total USDT Invested",value:"$456,320",change:"8%",tone:"cyan",direction:"up",icon:"investment"},
{label:"Daily ROI",value:"0.30%",change:"0.05%",tone:"purple",direction:"up",icon:"roi"},
{label:"Total Token Distributed",value:"1,234,567 AMGP",change:"18%",tone:"purple",direction:"up",icon:"token"},
{label:"Token Treasury Balance",value:"980,000 AMGP",change:"4%",tone:"cyan",direction:"up",icon:"treasury"},
{label:"Buyback Volume",value:"$24,680",change:"11%",tone:"green",direction:"up",icon:"buyback"},
{label:"Withdrawal Volume",value:"$18,420",change:"6%",tone:"orange",direction:"up",icon:"withdrawal"},
{label:"Pending Transactions",value:"24",change:"3",tone:"yellow",direction:"down",icon:"pending"},
{label:"Failed Transactions",value:"3",change:"1",tone:"red",direction:"down",icon:"failed"}
];
export const transactions=[
{user:"Rahul Sharma",type:"Investment",amount:"+500 USDT",status:"Completed",date:"2025-09-01 13:30"},
{user:"Priya Singh",type:"ROI Payout",amount:"+150 AMGP",status:"Completed",date:"2025-08-31 16:24"},
{user:"Amit Kumar",type:"Withdrawal",amount:"-200 USDT",status:"Pending",date:"2025-08-30 11:15"},
{user:"Sneha Patel",type:"Buyback",amount:"-100 AMGP",status:"Completed",date:"2025-08-29 14:42"},
{user:"Vikash Yadav",type:"Token Transfer",amount:"+75 AMGP",status:"Completed",date:"2025-08-28 09:20"}
];
export const userStats=[
{label:"Total Users",value:"2,548",change:"12%",tone:"blue",direction:"up",icon:"users"},
{label:"Verified Users",value:"1,892",change:"15%",tone:"green",direction:"up",icon:"verified"},
{label:"Pending KYC",value:"412",change:"8%",tone:"purple",direction:"down",icon:"pending"},
{label:"Blocked Users",value:"244",change:"3%",tone:"red",direction:"down",icon:"blocked"}
];
export const users=[
{id:"#USR001",initials:"JD",name:"John Smith",email:"john@example.com",phone:"+1 234 567 8901",kyc:"Verified",account:"Active",plan:"Starter Plan",date:"2025-08-21 10:24",avatar:"blue"},
{id:"#USR002",initials:"AS",name:"Alice Brown",email:"alice@example.com",phone:"+1 987 654 3210",kyc:"Verified",account:"Active",plan:"Premium Plan",date:"2025-08-20 14:35",avatar:"purple"},
{id:"#USR003",initials:"MP",name:"Mike Peterson",email:"mike@example.com",phone:"+1 555 123 4567",kyc:"Pending",account:"Active",plan:"Basic Plan",date:"2025-08-19 09:12",avatar:"orange"},
{id:"#USR004",initials:"SB",name:"Sarah Wilson",email:"sarah@example.com",phone:"+1 222 333 4444",kyc:"Verified",account:"Active",plan:"VIP Plan",date:"2025-08-18 16:20",avatar:"teal"},
{id:"#USR005",initials:"RK",name:"Robert King",email:"robert@example.com",phone:"+1 777 888 9999",kyc:"Rejected",account:"Active",plan:"Starter Plan",date:"2025-08-17 11:03",avatar:"pink"},
{id:"#USR006",initials:"LT",name:"Laura Taylor",email:"laura@example.com",phone:"+1 444 555 6666",kyc:"Verified",account:"Active",plan:"Premium Plan",date:"2025-08-16 13:47",avatar:"violet"},
{id:"#USR007",initials:"DW",name:"David White",email:"david@example.com",phone:"+1 333 222 1111",kyc:"Pending",account:"Suspended",plan:"Basic Plan",date:"2025-08-15 10:11",avatar:"blue"},
{id:"#USR008",initials:"ET",name:"Emily Thomas",email:"emily@example.com",phone:"+1 666 777 8888",kyc:"Verified",account:"Active",plan:"VIP Plan",date:"2025-08-14 15:02",avatar:"purple"},
{id:"#USR009",initials:"JT",name:"James Harris",email:"james@example.com",phone:"+1 999 000 1112",kyc:"Pending",account:"Active",plan:"Starter Plan",date:"2025-08-13 09:38",avatar:"teal"},
{id:"#USR010",initials:"KL",name:"Karen Lee",email:"karen@example.com",phone:"+1 888 777 6665",kyc:"Verified",account:"Blocked",plan:"Premium Plan",date:"2025-08-12 12:26",avatar:"pink"}
];
export const userDashboardStats=[
{label:"Token Balance",value:"2,450 AMGP",helper:"≈ 1,225 USDT",tone:"blue"},
{label:"Investment",value:"10,000 USDT",helper:"Active investment",tone:"cyan"},
{label:"Today’s Profit",value:"60 AMGP",helper:"0.30% ROI",tone:"purple"},
{label:"Token Price",value:"0.50 USDT",helper:"+2.4%",tone:"green"}
];

export const dashboardOperational={
  dailyRoi:"0.30%",
  eligibleUsers:"1,892",
  estimatedTokenPayout:"11,360 AMGP",
  roiStatus:"Ready for admin review and release",
  pendingTransactions:"24",
  failedTransactions:"3",
  pendingWithdrawals:"8",
  pendingBuybacks:"6"
};
