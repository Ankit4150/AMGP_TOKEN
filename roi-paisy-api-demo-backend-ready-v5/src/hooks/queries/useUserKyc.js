import { useCallback, useEffect, useState } from "react";
import { mineUserKycApi, createUserKycApi } from "../../services/user/kycApi";

const STATUS_MAP={approved:"approved",verified:"approved",completed:"approved",pending:"pending",processing:"pending",under_review:"pending",rejected:"rejected",failed:"rejected"};
function normalizeRestriction(item){return typeof item==="string"?{label:item,description:""}:{label:item?.label||item?.name||"Restriction applied",description:item?.description||""};}
export function normalizeUserKyc(response){const p=response?.data??response??{};return{status:STATUS_MAP[String(p.status||"").toLowerCase()]||"not_started",verificationId:p.verificationId||p.verificationID||"",verificationDate:p.verificationDate||p.verifiedAt||"",reviewStatus:p.reviewStatus||"",restrictions:Array.isArray(p.restrictions)?p.restrictions.map(normalizeRestriction):[]};}
export function useUserKyc(){
 const [data,setData]=useState();const[error,setError]=useState(null);const[isPending,setPending]=useState(true);const[isFetching,setFetching]=useState(false);
 const fetchData=useCallback(async()=>{setFetching(true);setError(null);try{const r=await mineUserKycApi();setData(normalizeUserKyc(r));return r;}catch(e){setError(e);throw e;}finally{setPending(false);setFetching(false);}},[]);
 useEffect(()=>{fetchData().catch(()=>{});return undefined;},[fetchData]);
 return{data,error,isPending,isLoading:isPending,isFetching,isError:Boolean(error),refetch:fetchData};
}
function safeProviderUrl(value){try{const u=new URL(String(value||""));return u.protocol==="https:"?u.toString():"";}catch{return"";}}
export function useStartKyc(){const [isPending,setPending]=useState(false);const[error,setError]=useState(null);const mutate=useCallback(async()=>{setPending(true);setError(null);try{const r=await createUserKycApi({});const u=safeProviderUrl(r?.data?.verificationUrl??r?.verificationUrl);if(u)window.location.assign(u);return r;}catch(e){setError(e);throw e;}finally{setPending(false);}},[]);return{mutate,mutateAsync:mutate,isPending,isLoading:isPending,isError:Boolean(error),error};}
