import styled from "styled-components";

const Container = styled.div`
	height: 100%;
	display: flex;
	flex-direction: column;
`;

const HeaderArea = styled.div`
	height: 140px;
	display: flex;
	justify-content: center;
	align-items: flex-end;

	padding-bottom: 24px;

	font-size: 24px;
`;

const MainArea = styled.div`
	display: flex;
	flex-grow: 1;
`;

const LeftContainer = styled.div`
	width: 300px;
	display: flex;
	flex-direction: column;
`;

const RightContainer = styled.div`
	display: flex;
	flex-grow: 1;
`;

const App = () => {
	return (
		<Container>
			<HeaderArea>Header Area</HeaderArea>
			<MainArea>
				<LeftContainer>Widget List Area</LeftContainer>
				<RightContainer>test!</RightContainer>
			</MainArea>
		</Container>
	);
};

export default App;
