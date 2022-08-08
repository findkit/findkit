import { initModal } from "../src/modal";

// function App() {
//     return (
//         <StrictMode>
//             <FindkitProvider
//                 projectId="pJMDjQvEq"
//                 groups={[
//                     {
//                         id: "valu",
//                         title: "Valu.fi",
//                         filters: {
//                             tagQuery: [["domain/valu.fi"]],
//                             highlightLength: 10,
//                         },
//                         scoreBoost: 1,
//                         previewSize: 5,
//                     },
//                     {
//                         id: "statement",
//                         title: "Statement.fi",
//                         filters: {
//                             tagQuery: [["domain/statement.fi"]],
//                             highlightLength: 10,
//                         },
//                         scoreBoost: 1,
//                         previewSize: 5,
//                     },
//                 ]}
//             />
//         </StrictMode>
//     );
// }

// const engine = initModal({
//     projectId: "pJMDjQvEq",
//     groups: [
//         {
//             id: "valu",
//             title: "Valu.fi",
//             filters: {
//                 tagQuery: [["domain/valu.fi"]],
//                 highlightLength: 10,
//             },
//             scoreBoost: 1,
//             previewSize: 5,
//         },
//         {
//             id: "statement",
//             title: "Statement.fi",
//             filters: {
//                 tagQuery: [["domain/statement.fi"]],
//                 highlightLength: 10,
//             },
//             scoreBoost: 1,
//             previewSize: 5,
//         },
//     ],
// });

// document.getElementById("open-button")?.addEventListener("click", () => {
//     engine.open();
// });

// ReactDOM.render(<App />, document.getElementById("app"));
