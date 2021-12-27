import styled from "styled-components";
import { WidthProvider, Responsive, Layout, Layouts } from "react-grid-layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	flex-grow: 1;

	user-select: none;
`;

const ToolbarArea = styled.div`
	display: flex;
	justify-content: space-between;

	border-bottom: 1px solid;
`;

const ContentArea = styled.div`
	display: flex;
	flex-grow: 1;
`;

interface ItemProps extends Layout {
	name: string;
	isGroup?: boolean;
}

const GridLayout = WidthProvider(Responsive);

// NOTE 초기 데이터
const INIT_ITEMS = [
	{
		name: "Group 1",
		isGroup: true,
		i: "0",
		x: 0,
		y: 0,
		w: 8,
		h: 1,
		isDraggable: false,
		isResizable: false,
	},
	{
		name: "Item 1",
		i: "1",
		x: 0,
		y: 1,
		w: 2,
		h: 2,
	},
	{
		name: "Item 2",
		i: "2",
		x: 3,
		y: 1,
		w: 2,
		h: 2,
	},
	{
		name: "Group 2",
		isGroup: true,
		i: "3",
		x: 0,
		y: 5,
		w: 8,
		h: 1,
		isDraggable: false,
		isResizable: false,
	},
	{
		name: "Item 3",
		i: "4",
		x: 0,
		y: 3,
		w: 2,
		h: 2,
	},
	{
		name: "Item 4",
		i: "5",
		x: 0,
		y: 6,
		w: 2,
		h: 2,
	},
	{
		name: "Group 3",
		isGroup: true,
		i: "6",
		x: 0,
		y: 8,
		w: 8,
		h: 1,
		isDraggable: false,
		isResizable: false,
	},
	{
		name: "Item 5",
		i: "7",
		x: 0,
		y: 9,
		w: 2,
		h: 2,
	},
	{
		name: "Item 6",
		i: "8",
		x: 2,
		y: 9,
		w: 2,
		h: 2,
	},
];

const GridContainer = () => {
	// NOTE 전체 아이템
	const [allItems, changeAllItems] = useState<Map<string, ItemProps>>(
		new Map(),
	);

	// NOTE 아이템 중 그룹인 아이템의 아이디 목록
	const [groups, changeGroups] = useState<Set<string>>(new Set());

	// NOTE 위젯 아이디 목록을 그룹 별로 묶음
	const [widgetsByGroup, changeWidgetsByGroup] = useState<
		Map<string, Set<string>>
	>(new Map());

	// NOTE 닫은 그룹의 아이디 목록
	const [closedGroups, changeClosedGroups] = useState<Set<string>>(new Set());

	// NOTE 닫은 그룹 소속인 위젯 아이디 목록
	const closedWidgets = useMemo(
		() =>
			closedGroups.size
				? new Set(
						[...closedGroups].reduce(
							(closedWidgets: Array<string>, groupId) => {
								const widgets = widgetsByGroup.get(groupId) || new Set();
								closedWidgets = [...closedWidgets, ...widgets];
								return closedWidgets;
							},
							[],
						),
				  )
				: new Set(),
		[closedGroups, widgetsByGroup],
	);

	// NOTE 레이아웃 상태
	const [layouts, changeLayouts] = useState<Layouts>({});
	// NOTE 현재 레이아웃 타입(lg | md | sm | xs | xxs)
	const breakpointRef = useRef<string>("");

	// NOTE 실제 화면상에 출력되는 아이템 목록
	const combinedItems = useMemo(() => {
		if (!groups.size) return [];

		return closedGroups.size
			? [...allItems.values()].filter((item) => !closedWidgets.has(item.i))
			: [...allItems.values()];
	}, [allItems, closedGroups.size, closedWidgets, groups.size]);

	// NOTE numeric string 값 비교 함수 - 아이템 아이디(i) sort시 필요
	const numericStringCompare = useCallback(
		(a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }),
		[],
	);

	// NOTE 신규 추가 아이템에 부여되는 유니크한 아이디 값
	const itemIdRef = useRef<string>(
		allItems.size
			? `${
					([...allItems.keys()]
						.sort((a, b) => numericStringCompare(a, b))
						.pop() as string) + 1
			  }`
			: `0`,
	);

	// NOTE 그룹의 y값이 큰 순서대로 y값을 키로 하는 그룹 목록 - 위젯의 소속 그룹을 찾는 용도
	const groupYvalues = useMemo(
		() =>
			[...groups]
				.map((groupId) => allItems.get(groupId) as ItemProps)
				.sort(({ y: a }, { y: b }) => b - a)
				.reduce(
					(groupList: Map<number, ItemProps>, group) =>
						groupList.set(group.y, group),
					new Map(),
				),
		[allItems, groups],
	);

	// NOTE 위젯 아이디로 소속 그룹의 아이디 찾는 함수
	const getGroupId = useCallback(
		({ widgetId }: { widgetId: string }): string =>
			[...widgetsByGroup]
				.find(([, widgetIds]) => widgetIds.has(widgetId))
				?.shift() as string,
		[widgetsByGroup],
	);

	// NOTE 그룹 collapse
	const onClickGroupCollapse = useCallback(
		({ groupId, groupY }: { groupId: string; groupY: number }) => {
			console.log("collapse");
			const closedGroupIds = new Set(closedGroups);
			// 닫혀있는 그룹을 다시 오픈하는 경우
			if (closedGroupIds.has(groupId)) {
				closedGroupIds.delete(groupId);

				// 그룹 하위 위젯이 있는 경우
				if (widgetsByGroup.has(groupId)) {
					const widgets = widgetsByGroup.get(groupId) as Set<string>;

					// 하위 위젯 중 가장 큰 y값을 가진 위젯 속성
					const {
						y: maxItemY,
						h: maxItemH,
						// i: maxItemId,
					} = [...widgets]
						.map((widgetId) => allItems.get(widgetId) as ItemProps)
						.sort(({ y: a }, { y: b }) => b - a)
						.shift() as ItemProps;

					// 오픈됐을 때 그룹의 높이값
					const groupHeight = maxItemY - groupY + maxItemH;

					const items = new Map(allItems);
					[...allItems].forEach(([itemId, item]) => {
						// 그룹인 경우 드래그 속성 변경(close 상태: 드래그 가능 <-> open 상태: 드래그 불가)
						itemId === groupId &&
							items.set(itemId, { ...item, isDraggable: false });

						// 아이템의 y값이 그룹 하위 위젯 중 가장 큰 y값 보다 큰 아이템일 경우 그룹의 높이값 더해줌
						item.y > groupY &&
							!widgets.has(item.i) &&
							items.set(itemId, { ...item, y: item.y + groupHeight });
					});

					changeAllItems(items);
				}
			} else {
				closedGroupIds.add(groupId);

				const currentGroup = allItems.get(groupId) as ItemProps;
				const layout = layouts[breakpointRef.current];
				changeAllItems((allItems) => {
					allItems = new Map(allItems);

					layout.forEach(({ i, y }) =>
						allItems.set(i, { ...(allItems.get(i) as ItemProps), y }),
					);

					allItems.set(groupId, { ...currentGroup, isDraggable: true });

					return allItems;
				});
			}

			changeClosedGroups(closedGroupIds);
		},
		[allItems, closedGroups, layouts, widgetsByGroup],
	);

	// const onDragStart = useCallback(
	// 	(layout: Array<Layout>, originItem) =>
	// 		groups.has(originItem.i) && changeIsPreventCollision(true),
	// 	[groups],
	// );

	// 그룹 이동할 수 있는 범위
	const draggableYRef = useRef<{ yValues: Set<number>; maxY: number } | null>(
		null,
	);
	const onDrag = useCallback(
		(layout: Array<Layout>, originItem, changedItem) => {
			// 그룹이 아니면 리턴
			if (!groups.has(originItem.i)) return;

			// // 이동 위치의 그룹 ID
			// const currentGroupId = (
			// 	[...groups]
			// 		.map((groupId) => layout.find(({ i }) => i === groupId) as ItemProps)
			// 		.sort(({ y: a }, { y: b }) => b - a)
			// 		.find(({ y }) => y < changedItem.y) as ItemProps
			// ).i;

			// 그룹 y값들
			const draggableYvalues = new Set(
				[...groupYvalues.values()]
					.filter(
						({ i }) => i !== originItem.i,
						// ||							(!closedGroups.has(i) && changedItem.y !== y),
					)
					.filter(
						({ i, y }) => !(!closedGroups.has(i) && y === originItem.y + 1),
					)
					.map(({ y }) => y),
			);

			// y값이 제일 큰 그룹
			const maxGroup = [...groupYvalues.values()].shift() as ItemProps;

			// y값이 제일 큰 그룹이 닫힌 그룹이 아니면서 하위 위젯이 있는 경우 - 위젯 중 y값이 가장 큰 경우 체크
			if (!closedGroups.has(maxGroup.i) && widgetsByGroup.has(maxGroup.i)) {
				const widgets = widgetsByGroup.get(maxGroup.i) as Set<string>;

				// 하위 위젯 중 가장 큰 y값을 가진 위젯 속성
				const { y: maxItemY, h: maxItemH } = [...widgets]
					// .map((widgetId) => allItems.get(widgetId) as ItemProps)
					.map(
						(widgetId) => layout.find(({ i }) => i === widgetId) as ItemProps,
					)
					.sort(({ y: a }, { y: b }) => b - a)
					.shift() as ItemProps;

				// 마지막에 추가할 수 있는 y값
				const maxY = maxItemY + maxItemH;
				draggableYvalues.delete(maxGroup.y);
				draggableYRef.current = { yValues: draggableYvalues, maxY };

				// draggableYvalues.add(maxY);
			}
			// y값이 제일 큰 그룹이 닫힌 그룹이라면
			const maxY = maxGroup.y;
			draggableYRef.current = { yValues: draggableYvalues, maxY };

			// draggableYvalues.has(changedItem.y)
			// 	? changeIsPreventCollision(false)
			// 	: changeIsPreventCollision(true);
		},
		[closedGroups, groupYvalues, groups, widgetsByGroup],
	);

	// NOTE 아이템 이동 시 처리
	const onDragStop = useCallback(
		(layout: Array<Layout>, originItem, changedItem) => {
			console.log("drag stop");
			// 위젯이 첫번째 그룹보다 앞쪽에 위치할 수 없음
			if (!groups.has(originItem.i) && changedItem.y < 1) return;

			// 아이템이 위젯이고 위치(y값) 변동이 있는 경우
			if (!groups.has(originItem.i) && originItem.y !== changedItem.y) {
				// 기존 소속 그룹 ID
				const originGroupId = getGroupId({ widgetId: originItem.i });

				// 이동 위치의 그룹 ID
				const currentGroupId = (
					[...groups]
						.map(
							(groupId) => layout.find(({ i }) => i === groupId) as ItemProps,
						)
						.sort(({ y: a }, { y: b }) => b - a)
						.find(({ y }) => y < changedItem.y) as ItemProps
				).i;

				// 이전 그룹과 이동 위치 그룹 아이디가 다르면 소속 그룹 변경 처리
				if (originGroupId !== currentGroupId) {
					changeWidgetsByGroup((widgetsByGroup) => {
						widgetsByGroup = new Map(widgetsByGroup);

						const originGroupWidgets = widgetsByGroup.get(
							originGroupId,
						) as Set<string>;
						originGroupWidgets.delete(originItem.i);
						originGroupWidgets.size
							? widgetsByGroup.set(originGroupId, originGroupWidgets)
							: widgetsByGroup.delete(originGroupId);

						const currentGroupWidgets =
							widgetsByGroup.get(currentGroupId) || new Set();
						currentGroupWidgets.add(originItem.i);
						widgetsByGroup.set(currentGroupId, currentGroupWidgets);

						return widgetsByGroup;
					});

					// 새 소속 그룹이 닫힌 상태면 오픈 처리
					closedGroups.has(currentGroupId) &&
						onClickGroupCollapse({
							groupId: currentGroupId,
							groupY: (
								layout.find(({ i }) => i === currentGroupId) as ItemProps
							).y,
						});
				}
			}

			const draggableY = draggableYRef.current;
			console.log(
				"draggable? ",
				draggableY &&
					(draggableY.yValues.has(changedItem.y) ||
						draggableY.maxY <= changedItem.y),
			);
			if (
				draggableY &&
				!(
					draggableY.yValues.has(changedItem.y) ||
					draggableY.maxY <= changedItem.y
				)
			)
				return (draggableYRef.current = null);
			// layout으로 들어온 변동된 아이템 속성을 상태에 반영
			const items = new Map(allItems);
			layout.forEach((changedItem) => {
				const itemId = changedItem.i;

				const originItem = items.get(itemId) as ItemProps;

				// 닫혀있는 그룹일 경우 그 하위 위젯 y도 그룹y의 변동값을 반영해줘야함
				if (closedGroups.has(itemId) && widgetsByGroup.has(itemId)) {
					const movedYvalue = changedItem.y - originItem.y;
					[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
						(widgetId) => {
							const { y: itemY, ...item } = items.get(widgetId) as ItemProps;
							items.set(widgetId, {
								...item,
								y: itemY + movedYvalue,
							});
						},
					);
				}

				items.set(itemId, {
					...originItem,
					...changedItem,
				});
			});

			changeAllItems(items);
			draggableYRef.current = null;
		},
		[
			allItems,
			closedGroups,
			getGroupId,
			groups,
			onClickGroupCollapse,
			widgetsByGroup,
		],
	);

	// NOTE 아이템 사이즈 변경 시 처리
	const onResizeStop = useCallback(
		(layout: Array<Layout>) => {
			console.log("resize stop");
			const items = new Map(allItems);

			layout.forEach((changedItem) => {
				const itemId = changedItem.i;
				const originItem = items.get(itemId) as ItemProps;

				// 닫혀있는 그룹일 경우 그 하위 위젯 y도 그룹y의 변동값을 반영해줘야함
				if (closedGroups.has(itemId) && widgetsByGroup.has(itemId)) {
					const movedYvalue = changedItem.y - originItem.y;
					[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
						(widgetId) => {
							const { y: itemY, ...item } = items.get(widgetId) as ItemProps;
							items.set(widgetId, {
								...item,
								y: itemY + movedYvalue,
							});
						},
					);
				}

				items.set(itemId, {
					...originItem,
					...changedItem,
				});
			});

			changeAllItems(items);
		},
		[allItems, closedGroups, widgetsByGroup],
	);

	// NOTE 위젯 삭제
	const onClickDeleteWidget = useCallback(
		({ widgetId }) => {
			const items = allItems;
			items.delete(widgetId);
			changeAllItems(items);

			const groupId = getGroupId({ widgetId });

			changeWidgetsByGroup((widgetsByGroup) => {
				widgetsByGroup = new Map(widgetsByGroup);
				const widgets = widgetsByGroup.get(groupId) as Set<string>;
				widgets.delete(widgetId);
				widgets.size
					? widgetsByGroup.set(groupId, widgets)
					: widgetsByGroup.delete(groupId);
				return widgetsByGroup;
			});
		},
		[allItems, getGroupId],
	);

	// NOTE 컴포넌트 너비 변동으로 레이아웃 타입이 변경될 때마다 레이아웃 타입 저장
	const onBreakpointChange = useCallback(
		(layoutType) => (breakpointRef.current = layoutType),
		[],
	);

	// NOTE 레이아웃 변동될 때 처리
	const onLayoutChange = useCallback((layout: Array<Layout>) => {
		console.log("layout change");
		const currentBreakpoint = breakpointRef.current;

		changeLayouts((layouts) => ({
			...layouts,
			[currentBreakpoint]: layout,
		}));

		// const defaultLayouts = {
		// 	lg: combinedItems,
		// 	md: combinedItems,
		// 	sm: combinedItems,
		// };

		// changeLayouts((layouts) => {
		// 	layouts = { ...layouts } || {};

		// 	switch (currentBreakpoint) {
		// 		case "lg":
		// 		case "md":
		// 		case "sm":
		// 			layouts = layouts
		// 				? {
		// 						...layouts,
		// 						...defaultLayouts,
		// 				  }
		// 				: defaultLayouts;
		// 			break;

		// 		case "xs":
		// 		case "xxs":
		// 			break;

		// 		default:
		// 			layouts = { ...defaultLayouts };
		// 			break;
		// 	}

		// 	return layouts;
		// });
	}, []);

	// NOTE 초기 데이터가 있는 경우 아이템을 전체 아이템/그룹/그룹 소속 위젯으로 상태 구분 처리 - 최초 한번만 실행하도록
	useEffect(() => {
		if (!INIT_ITEMS.length) return;

		const groups: Map<string, ItemProps> = new Map();
		const widgets: Map<string, ItemProps> = new Map();

		// INIT_ITEMS.forEach((item) =>
		// 	item.isGroup ? groups.set(item.i, item) : widgets.set(item.i, item),
		// );

		const initItems = INIT_ITEMS.reduce(
			(items: Map<string, ItemProps>, item) => {
				// 그룹/위젯 분류
				item.isGroup ? groups.set(item.i, item) : widgets.set(item.i, item);

				return items.set(item.i, item);
			},
			new Map(),
		);

		/**
		 * y값으로 소속 그룹 판단
		 *  1. 그룹의 y값을 큰 순서대로 정렬
		 *  2. 아이템의 y값은 소속 그룹 y값 보다 작음
		 */
		const getGroupId = ({ itemY }: { itemY: number }) =>
			(
				[...groups.values()]
					.sort(({ y: a }, { y: b }) => b - a)
					.find(({ y }) => y < itemY) as ItemProps
			).i;

		const widgetsByGroup: Map<string, Set<string>> = new Map();

		[...widgets.values()].forEach(({ i, y }) => {
			const groupId = getGroupId({ itemY: y });
			const widgetIds = widgetsByGroup.get(groupId) || new Set();

			widgetsByGroup.set(groupId, widgetIds.add(i));
		});

		// const initItems = INIT_ITEMS.reduce(
		// 	(items: Map<string, ItemProps>, item) => items.set(item.i, item),
		// 	new Map(),
		// );

		changeAllItems(initItems);
		changeGroups(new Set([...groups.keys()]));
		changeWidgetsByGroup(widgetsByGroup);
	}, []);

	return (
		<Container>
			<ToolbarArea>
				<div style={{ display: "flex", alignItems: "center" }}>Toolbar</div>
				<div style={{ border: "1px solid", padding: "4px" }}>+++</div>
			</ToolbarArea>
			<ContentArea>
				<GridLayout
					className="layout"
					// compactType="horizontal"
					// compactType={null}
					rowHeight={30}
					onLayoutChange={onLayoutChange}
					layouts={layouts}
					style={{ width: "100%" }}
					// isBounded
					cols={{ lg: 8, md: 8, sm: 8, xs: 1, xxs: 1 }}
					onBreakpointChange={onBreakpointChange}
					onResizeStop={onResizeStop}
					// onDragStart={onDragStart}
					onDrag={onDrag}
					onDragStop={onDragStop}
					// preventCollision={isPreventCollision}
					// draggableHandle=".handdle"
				>
					{!!combinedItems.length &&
						combinedItems.map((item) => {
							const { i: itemId, name, y } = item;
							return (
								<div
									key={itemId}
									data-grid={item}
									style={{
										border: "1px solid #666",
										borderRadius: 4,
										padding: "4px 8px",

										backgroundColor: closedGroups.has(itemId) ? "#ddd" : "#fff",
									}}
								>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<div
											style={{
												cursor: groups.has(itemId) ? "pointer" : "default",
											}}
											onClick={() =>
												groups.has(itemId) &&
												onClickGroupCollapse({ groupId: itemId, groupY: y })
											}
											// className="handdle"
										>
											{name} - key: {itemId}
										</div>
										{!groups.has(itemId) && (
											<div
												style={{
													border: "1px solid",
													padding: "2px",
													cursor: "pointer",
												}}
												onClick={() => onClickDeleteWidget(itemId)}
											>
												Del
											</div>
										)}
									</div>
								</div>
							);
						})}
				</GridLayout>
			</ContentArea>
		</Container>
	);
};

export default GridContainer;
