import "../../styles/Skeleton.css";

export default function Skeleton({ className = "" }) {
  return <div className={`skeleton ${className}`}></div>;
}
