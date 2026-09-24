import { userDashboard } from "./data/dashboard";
export function mockUserApi(url){
  if(url==="/user/dashboard") return {success:true,data:userDashboard};
  return {success:true,data:{items:[],total:0}};
}
