// src/components/aurora/AuroraFamilyCard.tsx
import { useEntity, type EntityName } from "@hakit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
	people: EntityName[];
	className?: string;
}

// Separate component so hooks are called at the top level and not inside a loop callback
function FamilyMemberRow({ id }: { id: EntityName }) {
	const e = useEntity(id);
	const atHome = e.state === "home";
	const last = new Date(e.last_changed).toLocaleString("fr-FR", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
	});
	return (
		<li className="py-2 flex items-center justify-between">
			<span className="text-white/90 truncate">
				{e.attributes.friendly_name || id}
			</span>
			<span
				className={`text-xs ${atHome ? "text-green-300" : "text-white/60"}`}
			>
				{atHome ? "Home" : "Away"} • {last}
			</span>
		</li>
	);
}

export function AuroraFamilyCard({ people, className }: Props) {
	return (
		<Card
			className={`backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300 ${className || ""}`}
		>
			<CardHeader className="pb-3">
				<CardTitle className="text-white text-base font-semibold">
					Family
				</CardTitle>
			</CardHeader>
			<CardContent className="p-5 pt-0">
				<ul className="divide-y divide-white/10">
					{people.map((id) => (
						<FamilyMemberRow id={id} key={id} />
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
