import { useState } from "react";
import "./App.css";

function App() {
	const [names, setNames] = useState("");
	const [numTeams, setNumTeams] = useState(2);
	const [teams, setTeams] = useState<string[][]>([]);

	const generateTeams = () => {
		const nameList = names
			.split("\n")
			.map((n) => n.trim())
			.filter((n) => n);
		if (nameList.length === 0) return;

		const shuffled = [...nameList].sort(() => Math.random() - 0.5);
		const teamSize = Math.ceil(shuffled.length / numTeams);
		const newTeams: string[][] = [];

		for (let i = 0; i < numTeams; i++) {
			newTeams.push(shuffled.slice(i * teamSize, (i + 1) * teamSize));
		}

		setTeams(newTeams);
	};

	return (
		<div className="app">
			<div className="team-generator">
				<h1>Miss's Random Team Generator 😘</h1>
				<h3>Kiss those ads goodbye 🤮</h3>

				<div className="control-group">
					<label htmlFor="names">Enter names (one per line):</label>
					<textarea
						id="names"
						value={names}
						onChange={(e) => setNames(e.target.value)}
						placeholder="Enter names, one per line"
						rows={10}
					/>
				</div>

				<div className="field-row">
					<label htmlFor="numTeams">Number of teams:</label>
					<select
						id="numTeams"
						value={numTeams}
						onChange={(e) => setNumTeams(Number(e.target.value))}
					>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</div>

				<button className="generate-button" onClick={generateTeams}>
					Generate Teams
				</button>

				{teams.length > 0 && (
					<div className="teams-output">
						<h2>Generated Teams:</h2>
						{teams.map((team, i) => (
							<div key={i} className="team-card">
								<h3>Team {i + 1}</h3>
								<ul className="team-list">
									{team.map((name) => (
										<li key={name} className="team-member">
											{name}
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
