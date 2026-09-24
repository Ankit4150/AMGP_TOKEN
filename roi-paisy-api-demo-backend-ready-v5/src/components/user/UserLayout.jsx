import React,{useState} from "react";
import UserSidebar from "./UserSidebar";
import Topbar from "../shared/Topbar";
export default function UserLayout({children}){const [open,setOpen]=useState(false);return <div className="min-h-screen overflow-x-hidden bg-[#f5f9fe] dark:bg-[#0a1424]"><UserSidebar open={open} onClose={()=>setOpen(false)}/><div className="min-w-0 lg:pl-[284px]"><Topbar onMenu={()=>setOpen(true)}/><main className="mx-auto w-full max-w-[1660px] min-w-0 overflow-x-hidden p-3 pb-8 sm:p-5 lg:p-6">{children}</main></div></div>}