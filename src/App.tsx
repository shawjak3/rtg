import { useState, useRef } from "react";
import "./App.css";

function App() {
	const [names, setNames] = useState("");
	const [numTeams, setNumTeams] = useState(2);
	const [sameTeamMembers, setSameTeamMembers] = useState("");
	const [excludeGroup, setExcludeGroup] = useState("");
	const [teams, setTeams] = useState<string[][]>([]);
	const [showModal, setShowModal] = useState(false);
	const teamsRef = useRef<HTMLDivElement>(null);

	const normalize = (value: string) => value.trim().toLowerCase();
	const findName = (list: string[], target: string | undefined) =>
		target
			? list.find((name) => normalize(name) === normalize(target))
			: undefined;
	const findNames = (list: string[], targets: string[]) =>
		targets
			.map((target) => findName(list, target))
			.filter((name): name is string => Boolean(name));

	const generateTeams = () => {
		const nameList = names
			.split("\n")
			.map((n) => n.trim())
			.filter(Boolean);
		if (nameList.length === 0) return;

		const sameTeamInputs = sameTeamMembers
			.split("\n")
			.map((n) => n.trim())
			.filter(Boolean);
		const sameTeam = findNames(nameList, sameTeamInputs);

		const excludeInputs = excludeGroup
			.split("\n")
			.map((n) => n.trim())
			.filter(Boolean);
		const excludePrimary = findName(nameList, excludeInputs[0]);
		const excludeOthers = findNames(nameList, excludeInputs.slice(1));

		const shuffled = [...nameList].sort(() => Math.random() - 0.5);
		const teamSize = Math.ceil(shuffled.length / numTeams);
		const newTeams: string[][] = [];

		for (let i = 0; i < numTeams; i++) {
			newTeams.push(shuffled.slice(i * teamSize, (i + 1) * teamSize));
		}

		const movePerson = (
			person: string,
			targetTeam: number,
			teams: string[][],
		) => {
			const fromTeam = teams.findIndex((team) =>
				team.some((member) => normalize(member) === normalize(person)),
			);
			if (fromTeam === -1 || fromTeam === targetTeam) return;

			teams[fromTeam] = teams[fromTeam].filter(
				(member) => normalize(member) !== normalize(person),
			);
			teams[targetTeam] = [...teams[targetTeam], person];
		};

		const ensureGroupTogether = (group: string[], teams: string[][]) => {
			const validGroup = group.filter((name): name is string =>
				Boolean(name),
			);
			if (validGroup.length < 2) return;

			const targetTeam = validGroup
				.map((name) =>
					teams.findIndex((team) =>
						team.some(
							(member) => normalize(member) === normalize(name),
						),
					),
				)
				.find((index) => index >= 0);
			if (targetTeam === undefined) return;

			validGroup.forEach((name) => movePerson(name, targetTeam, teams));
		};

		const keepPrimaryApart = (
			primary: string | undefined,
			others: string[],
			teams: string[][],
		) => {
			if (!primary || others.length === 0) return;
			others.forEach((other) => {
				const primaryTeam = teams.findIndex((team) =>
					team.some(
						(member) => normalize(member) === normalize(primary),
					),
				);
				const otherTeam = teams.findIndex((team) =>
					team.some(
						(member) => normalize(member) === normalize(other),
					),
				);
				if (
					primaryTeam === -1 ||
					otherTeam === -1 ||
					primaryTeam !== otherTeam
				)
					return;

				const fallback = teams.findIndex(
					(_, index) =>
						index !== primaryTeam &&
						!teams[index].some(
							(member) =>
								normalize(member) === normalize(primary),
						),
				);
				if (fallback >= 0) {
					movePerson(other, fallback, teams);
				}
			});
		};

		const allConstraintNames = [
			...sameTeam,
			...(excludePrimary ? [excludePrimary] : []),
			...excludeOthers,
		];

		const isConstraintName = (person: string) =>
			allConstraintNames.some(
				(name) => normalize(name) === normalize(person),
			);

		const isSameTeam = (a: string, b: string, teams: string[][]) => {
			const teamA = teams.findIndex((team) =>
				team.some((member) => normalize(member) === normalize(a)),
			);
			const teamB = teams.findIndex((team) =>
				team.some((member) => normalize(member) === normalize(b)),
			);
			return teamA !== -1 && teamA === teamB;
		};

		const violatesConstraintsIfMoved = (
			person: string,
			fromTeam: number,
			toTeam: number,
			teams: string[][],
		) => {
			const nextTeams = teams.map((team, index) =>
				index === fromTeam
					? team.filter(
							(member) => normalize(member) !== normalize(person),
						)
					: [...team],
			);
			nextTeams[toTeam].push(person);

			if (sameTeam.length >= 2) {
				const groupTeam = nextTeams.findIndex((team) =>
					sameTeam.some((member) =>
						team.some(
							(name) => normalize(name) === normalize(member),
						),
					),
				);
				if (groupTeam === -1) return true;
				const groupValid = sameTeam.every((member) =>
					nextTeams[groupTeam].some(
						(name) => normalize(name) === normalize(member),
					),
				);
				if (!groupValid) return true;
			}

			if (excludePrimary && excludeOthers.length > 0) {
				return excludeOthers.some((other) =>
					isSameTeam(excludePrimary, other, nextTeams),
				);
			}

			return false;
		};

		const canMovePerson = (
			person: string,
			fromTeam: number,
			toTeam: number,
			teams: string[][],
		) => !violatesConstraintsIfMoved(person, fromTeam, toTeam, teams);

		const rebalanceTeams = (teams: string[][]) => {
			const totalPeople = nameList.length;
			const baseSize = Math.floor(totalPeople / numTeams);
			const remainder = totalPeople % numTeams;
			const targetSizes = Array(numTeams)
				.fill(baseSize)
				.map((size, i) => (i < remainder ? size + 1 : size));

			for (let i = 0; i < teams.length; i++) {
				while (teams[i].length > targetSizes[i]) {
					const targetTeam = teams.findIndex(
						(_, index) => teams[index].length < targetSizes[index],
					);
					if (targetTeam === -1) break;

					const candidates = [
						...teams[i].filter(
							(person) => !isConstraintName(person),
						),
						...teams[i].filter((person) =>
							isConstraintName(person),
						),
					];
					const personToMove = candidates.find((person) =>
						canMovePerson(person, i, targetTeam, teams),
					);
					if (!personToMove) break;

					const indexToMove = teams[i].findIndex(
						(person) => person === personToMove,
					);
					const [moved] = teams[i].splice(indexToMove, 1);
					teams[targetTeam].push(moved);
				}
			}
		};

		if (sameTeam.length >= 2) {
			ensureGroupTogether(sameTeam, newTeams);
		}
		if (excludePrimary) {
			keepPrimaryApart(excludePrimary, excludeOthers, newTeams);
		}

		rebalanceTeams(newTeams);

		if (sameTeam.length >= 2) {
			ensureGroupTogether(sameTeam, newTeams);
		}
		if (excludePrimary) {
			keepPrimaryApart(excludePrimary, excludeOthers, newTeams);
		}

		setTeams(newTeams);

		setTimeout(() => {
			teamsRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 0);
	};

	return (
		<div className="app">
			<div className="team-generator">
				<h1>Random Team Generator</h1>
				<h3>
					Kiss those ads goodbye
					<span
						className="secret-trigger"
						onClick={() => setShowModal(true)}
					>
						🤮
					</span>
				</h3>

				<div className="control-group">
					<label htmlFor="names">Enter names (one per line):</label>
					<textarea
						id="names"
						value={names}
						onChange={(e) => setNames(e.target.value)}
						placeholder="Names go here..."
						rows={16}
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
					<div className="teams-output" ref={teamsRef}>
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

				{showModal && (
					<div
						className="secret-modal-backdrop"
						onClick={() => setShowModal(false)}
					>
						<div
							className="secret-modal"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="secret-modal-header">
								<h2 className="secret-modal-title">
									Advanced Secret Options 🤫
								</h2>
								<button
									className="secret-modal-close"
									onClick={() => setShowModal(false)}
								>
									×
								</button>
							</div>
							<div className="control-group">
								<label htmlFor="sameTeam">
									Put these people on the same team:
								</label>
								<textarea
									id="sameTeam"
									value={sameTeamMembers}
									onChange={(e) =>
										setSameTeamMembers(e.target.value)
									}
									placeholder="One name per line"
									rows={5}
								/>
							</div>
							<div className="control-group">
								<label htmlFor="excludeGroup">
									Exclude the first person from anyone listed
									below:
								</label>
								<textarea
									id="excludeGroup"
									value={excludeGroup}
									onChange={(e) =>
										setExcludeGroup(e.target.value)
									}
									placeholder="One name per line"
									rows={5}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
