function createLink(relation, destination, append) {
	const link = document.createElement("link");
	link.rel = relation;
	link.href = destination;
	if (append) {
		head.appendChild(link);
	}
	return link;
}
// Theme colors
const root = document.documentElement.style;
const colorNames = ["background", "primary", "secondary", "accent", "text"];
for (const name of colorNames) {
	root.setProperty(`--${name}-color`, localStorage.getItem(`${name}Color`));
}
// Dark stylesheet
const head = document.getElementsByTagName("head")[0];
const darkStylesheet = createLink("stylesheet", "styles/dark.css", false);
let darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
let themeType = localStorage.getItem("themeType");
function updateDarkSheet(query) {
	themeType = localStorage.getItem("themeType");
	if (query.matches && themeType === null || themeType === "dark") {
		head.appendChild(darkStylesheet);
	} else if (head.contains(darkStylesheet)) {
		head.removeChild(darkStylesheet);
	}
}
updateDarkSheet(darkQuery);
darkQuery.addEventListener("change", updateDarkSheet);
// None stylesheet
const noneStylesheet = createLink("stylesheet", "styles/none.css", false);
if (themeType === "none") {
	head.appendChild(noneStylesheet);
}