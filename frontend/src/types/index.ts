export interface Group  { id:string; name:string; color:string; teams?:Team[]; createdAt:string }
export interface Team   { id:string; name:string; emoji:string; captain:string; groupId?:string; group?:Group; squad?:SquadMember[]; createdAt:string }
export interface SquadMember { id:string; teamId:string; name:string; role:string; createdAt:string }
export interface Match  {
  id:string; stage:string; groupId?:string; matchNo:string;
  team1Id:string; team2Id:string; team1:Team; team2:Team; group?:Group;
  date:string; time:string; year:number; venue:string;
  status:string; result:string; score1:string; score2:string; overs:number;
  highlights:any; innings1:any; sentiments?:Sentiment[]; createdAt:string;
}
export interface Player { id:string; name:string; emoji:string; teamId?:string; team?:Team; role:string; runs:number; wickets:number; strikeRate:number; economy:number; best:string; createdAt:string }
export interface BallEvent { id:string; matchId:string; innings:number; over:number; ball:number; runs:number; isWicket:boolean; isWide:boolean; isNoBall:boolean; isBye:boolean; batsman:string; bowler:string; commentary:string; createdAt:string }
export interface Sentiment { id:string; matchId:string; teamId:string; sessionId:string }
export interface SentimentData { total:number; team1:{id:string;name:string;votes:number}; team2:{id:string;name:string;votes:number}; userVote?:string }
export interface Ad   { id:string; content:string; active:boolean; sortOrder:number }
export interface Poll { id:string; type:string; question:string; options:string[]; votes:number[]; votedBy:Record<string,boolean> }
export interface Org  { id:string; name:string; role:string; emoji:string; since:string }
export interface Rule { id:number; content:string }
export interface Announcement { id:number; content:string }
export interface Gallery { id:string; emoji:string; label:string; category:string }
export interface LiveBatter { name:string; runs:number; balls:number; fours:number; sixes:number; out?:boolean; how?:string }
export interface LiveBowler { name:string; ballsBowled:number; wickets:number; runsConceded:number; economy:number }
export interface LiveState {
  matchId:string; innings:number; runs:number; wickets:number; balls:number; target?:number;
  battingFirst:string; bowlingFirst:string;
  striker:LiveBatter; nonstriker:LiveBatter; currentBowler:LiveBowler;
  batters:Record<string,LiveBatter>; bowlers:Record<string,LiveBowler>;
  extras:{wide:number;noball:number}; lastBalls:string[];
}
export interface Bootstrap { groups:Group[]; teams:Team[]; matches:Match[]; players:Player[]; polls:Poll[]; orgs:Org[]; rules:Rule[]; ann:Announcement[]; gallery:Gallery[]; ads:Ad[]; live:LiveState|null }
