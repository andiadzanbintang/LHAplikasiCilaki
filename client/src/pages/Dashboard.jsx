import AllResult from "../components/AllResult"
import Tutorial from "../components/Tutorial"

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="tutorial-section">
        <Tutorial />
      </div>
      <div className="final-result">
        <AllResult/>
      </div>
    </div>
  )
}
