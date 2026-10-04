export const catalog=[
{id:"connect4",name:"Four in a Row",emoji:"🔴🟡",subtitle:"Connect four before your rival"},
{id:"tictactoe",name:"Tic-Tac-Toe",emoji:"❌⭕",subtitle:"Classic three-in-a-row"},
{id:"dots",name:"Dots & Boxes",emoji:"🔵",subtitle:"Claim the most boxes"},
{id:"rps",name:"Rock Paper Scissors",emoji:"✊✋✌️",subtitle:"Secret simultaneous picks"},
{id:"wyr",name:"Would You Rather?",emoji:"🎉",subtitle:"Compare your choices"}
];
export function initialState(id,starter="A"){
 if(id==="tictactoe") return {turn:starter,cells:Array(9).fill(""),winner:null,draw:false};
 if(id==="connect4") return {turn:starter,cells:Array(42).fill(""),winner:null,draw:false};
 if(id==="dots") return {turn:starter,h:Array(30).fill(""),v:Array(30).fill(""),boxes:Array(25).fill(""),scores:{A:0,B:0},winner:null};
 if(id==="rps") return {round:1,picks:{A:null,B:null},roundWins:{A:0,B:0},winner:null,last:null};
 if(id==="wyr") return {index:0,picks:{A:null,B:null},matches:0,rounds:0,winner:null};
}
