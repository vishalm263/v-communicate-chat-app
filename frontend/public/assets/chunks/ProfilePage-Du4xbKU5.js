import{u as e,j as s}from"../index-CK06dqkR.js";import{r as a}from"./vendor-PtCq8RB_.js";import{s as l,U as t,j as r,P as i,k as n,_ as c}from"./ui-BN6vDYCP.js";import"./utils-CK2oMmzc.js";const d=()=>{var d;const{authUser:o,isUpdatingProfile:m,updateProfile:x}=e(),[p,u]=a.useState(null),[h,j]=a.useState(!1),[b,v]=a.useState("");return s.jsx("div",{className:"h-screen pt-20",children:s.jsx("div",{className:"max-w-2xl mx-auto p-4 py-8",children:s.jsxs("div",{className:"bg-base-300 rounded-xl p-6 space-y-8",children:[s.jsxs("div",{className:"text-center",children:[s.jsx("h1",{className:"text-2xl font-semibold ",children:"Profile"}),s.jsx("p",{className:"mt-2",children:"Your profile information"})]}),s.jsxs("div",{className:"flex flex-col items-center gap-4",children:[s.jsxs("div",{className:"relative",children:[s.jsx("img",{src:p||o.profilePic||"/avatar.png",alt:"Profile",className:"size-32 rounded-full object-cover border-4 "}),s.jsxs("label",{htmlFor:"avatar-upload",className:`\n                  absolute bottom-0 right-0 \n                  bg-base-content hover:scale-105\n                  p-2 rounded-full cursor-pointer \n                  transition-all duration-200\n                  ${m?"animate-pulse pointer-events-none":""}\n                `,children:[s.jsx(l,{className:"w-5 h-5 text-base-200"}),s.jsx("input",{type:"file",id:"avatar-upload",className:"hidden",accept:"image/*",onChange:async e=>{const s=e.target.files[0];if(!s)return;const a=new FileReader;a.readAsDataURL(s),a.onload=async()=>{const e=a.result;u(e),await x({profilePic:e})}},disabled:m})]})]}),s.jsx("p",{className:"text-sm text-zinc-400",children:m?"Uploading...":"Click the camera icon to update your photo"})]}),s.jsxs("div",{className:"space-y-6",children:[s.jsxs("div",{className:"space-y-1.5",children:[s.jsxs("div",{className:"text-sm text-zinc-400 flex items-center gap-2",children:[s.jsx(t,{className:"w-4 h-4"}),"Full Name"]}),s.jsx("p",{className:"px-4 py-2.5 bg-base-200 rounded-lg border",children:null==o?void 0:o.fullName})]}),s.jsxs("div",{className:"space-y-1.5",children:[s.jsxs("div",{className:"text-sm text-zinc-400 flex items-center gap-2",children:[s.jsx(r,{className:"w-4 h-4"}),"Username",s.jsxs("button",{onClick:()=>{if(h){if(""===b.trim())return void c.error("Username cannot be empty");if(b.trim().length<3)return void c.error("Username must be at least 3 characters");x({username:b.trim().toLowerCase()}).then((()=>{j(!1),v("")})).catch((e=>{}))}else v(o.username||""),j(!0)},className:"ml-auto flex items-center gap-1 text-primary hover:text-primary-focus",disabled:m,children:[s.jsx(i,{className:"w-3 h-3"}),s.jsx("span",{className:"text-xs",children:h?"Save":"Edit"})]})]}),h?s.jsx("div",{className:"relative",children:s.jsx("input",{type:"text",value:b,onChange:e=>v(e.target.value),className:"w-full px-4 py-2.5 bg-base-200 rounded-lg border focus:border-primary focus:outline-none",placeholder:"Enter new username",disabled:m})}):s.jsxs("p",{className:"px-4 py-2.5 bg-base-200 rounded-lg border",children:["@",null==o?void 0:o.username]})]}),s.jsxs("div",{className:"space-y-1.5",children:[s.jsxs("div",{className:"text-sm text-zinc-400 flex items-center gap-2",children:[s.jsx(n,{className:"w-4 h-4"}),"Email Address"]}),s.jsx("p",{className:"px-4 py-2.5 bg-base-200 rounded-lg border",children:null==o?void 0:o.email})]})]}),s.jsxs("div",{className:"mt-6 bg-base-300 rounded-xl p-6",children:[s.jsx("h2",{className:"text-lg font-medium  mb-4",children:"Account Information"}),s.jsxs("div",{className:"space-y-3 text-sm",children:[s.jsxs("div",{className:"flex items-center justify-between py-2 border-b border-zinc-700",children:[s.jsx("span",{children:"Member Since"}),s.jsx("span",{children:null==(d=o.createdAt)?void 0:d.split("T")[0]})]}),s.jsxs("div",{className:"flex items-center justify-between py-2",children:[s.jsx("span",{children:"Account Status"}),s.jsx("span",{className:"text-green-500",children:"Active"})]})]})]})]})})})};export{d as default};
