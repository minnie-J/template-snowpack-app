import { useState, useEffect } from "react";

import GlobalStyle from "./global-style";

import AppPresenter from "./app.presenter";

function App() {
	// Create the count state.
	const [count, setCount] = useState(0);
	// Create the counter (+1 every second).
	useEffect(() => {
		const timer = setTimeout(() => setCount(count + 1), 1000);
		return () => clearTimeout(timer);
	}, [count, setCount]);
	// Return the App component.
	return (
		<>
			<GlobalStyle />
			<AppPresenter />
		</>
	);
}

export default App;
