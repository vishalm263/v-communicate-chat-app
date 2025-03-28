import{b as e,u as s,j as a}from"../index-CK06dqkR.js";import{r as t}from"./vendor-PtCq8RB_.js";import{f as i,p as n,q as l,r,_ as c}from"./ui-BN6vDYCP.js";import"./utils-CK2oMmzc.js";const d=["system","light","dark"],o=[{id:1,content:"Hey! How's it going?",isSent:!1},{id:2,content:"I'm doing great! Just working on some new features.",isSent:!0}],m=({theme:e})=>"light"===e?a.jsx(n,{className:"w-5 h-5"}):"dark"===e?a.jsx(l,{className:"w-5 h-5"}):a.jsx(r,{className:"w-5 h-5"}),x=()=>{const{theme:n,setTheme:l}=e(),{authUser:r,updateProfile:x,isUpdatingProfile:h}=s(),[p,b]=t.useState((null==r?void 0:r.hideStatus)||!1);return a.jsx("div",{className:"h-screen container mx-auto px-4 pt-20 max-w-5xl",children:a.jsxs("div",{className:"space-y-8",children:[a.jsxs("div",{className:"bg-base-300 rounded-xl p-6 space-y-6",children:[a.jsxs("div",{className:"flex flex-col gap-1",children:[a.jsx("h2",{className:"text-lg font-semibold",children:"Theme"}),a.jsx("p",{className:"text-sm text-base-content/70",children:"Choose a theme for your chat interface"})]}),a.jsx("div",{className:"grid grid-cols-3 gap-4",children:d.map((e=>a.jsxs("button",{className:`\n                  group flex items-center gap-3 p-3 rounded-lg transition-colors\n                  ${n===e?"bg-base-200 ring-1 ring-primary/30":"hover:bg-base-200/50"}\n                `,onClick:()=>l(e),children:[a.jsx("div",{className:"w-8 h-8 rounded-full bg-base-content/10 flex items-center justify-center",children:a.jsx(m,{theme:e})}),a.jsx("span",{className:"font-medium capitalize",children:e})]},e)))})]}),a.jsxs("div",{className:"bg-base-300 rounded-xl p-6 space-y-6",children:[a.jsxs("div",{className:"flex flex-col gap-1",children:[a.jsx("h2",{className:"text-lg font-semibold",children:"Privacy"}),a.jsx("p",{className:"text-sm text-base-content/70",children:"Manage your privacy settings"})]}),a.jsxs("div",{className:"flex items-center justify-between",children:[a.jsxs("div",{children:[a.jsx("h3",{className:"font-medium",children:"Hide Online Status"}),a.jsx("p",{className:"text-sm text-base-content/70",children:"Others won't be able to see when you're online"})]}),a.jsx("input",{type:"checkbox",className:"toggle toggle-primary",checked:p,onChange:async()=>{const e=!p;b(e);try{await x({hideStatus:e}),c.success(`Online status is now ${e?"hidden":"visible"} to others`)}catch(s){b(!e),c.error("Failed to update status visibility")}},disabled:h})]})]}),a.jsxs("div",{className:"bg-base-300 rounded-xl p-6 space-y-4",children:[a.jsx("h3",{className:"text-lg font-semibold",children:"Preview"}),a.jsx("div",{className:"rounded-xl overflow-hidden bg-base-100 shadow-lg",children:a.jsx("div",{className:"p-4 bg-base-200",children:a.jsx("div",{className:"max-w-lg mx-auto",children:a.jsxs("div",{className:"bg-base-100 rounded-xl shadow-sm overflow-hidden",children:[a.jsx("div",{className:"px-4 py-3 border-b border-base-300 bg-base-100",children:a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium",children:"J"}),a.jsxs("div",{children:[a.jsx("h3",{className:"font-medium text-sm",children:"John Doe"}),a.jsx("p",{className:"text-xs text-base-content/70",children:"Online"})]})]})}),a.jsx("div",{className:"p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100",children:o.map((e=>a.jsx("div",{className:"flex "+(e.isSent?"justify-end":"justify-start"),children:a.jsxs("div",{className:`\n                            max-w-[80%] rounded-xl p-3 shadow-sm\n                            ${e.isSent?"bg-primary text-primary-content":"bg-base-200"}\n                          `,children:[a.jsx("p",{className:"text-sm",children:e.content}),a.jsx("p",{className:`\n                              text-[10px] mt-1.5\n                              ${e.isSent?"text-primary-content/70":"text-base-content/70"}\n                            `,children:"12:00 PM"})]})},e.id)))}),a.jsx("div",{className:"p-4 border-t border-base-300 bg-base-100",children:a.jsxs("div",{className:"flex gap-2",children:[a.jsx("input",{type:"text",className:"input input-bordered flex-1 text-sm h-10",placeholder:"Type a message...",value:"This is a preview",readOnly:!0}),a.jsx("button",{className:"btn btn-primary h-10 min-h-0",children:a.jsx(i,{size:18})})]})})]})})})})]})]})})};export{x as default};
