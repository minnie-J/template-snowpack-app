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

	// NOTE 닫은 그룹의 아이디(+그룹 높이) 목록
	const [closedGroups, changeClosedGroups] = useState<
		Map<string, { groupMaxHeight: number }>
	>(new Map());

	const [tempWidgetsByGroup, changeTempWidgetsByGroup] = useState<
		Map<string, Set<string>>
	>(new Map());

	// NOTE 전체 닫은 그룹 소속 위젯 아이디 목록
	const closedWidgets = useMemo(
		() =>
			[...closedGroups.keys()].reduce(
				(closedWidgetIds: Set<string>, closedGroupId: string) => {
					if (!widgetsByGroup.has(closedGroupId)) return closedWidgetIds;

					const closedWidgets = widgetsByGroup.get(
						closedGroupId,
					) as Set<string>;
					const tempWidgets = tempWidgetsByGroup.get(closedGroupId);

					tempWidgets &&
						[...tempWidgets].forEach(
							(widgetId) =>
								closedWidgets.has(widgetId) && closedWidgets.delete(widgetId),
						);

					return new Set([...closedWidgetIds, ...closedWidgets]);
				},
				new Set(),
			),
		[closedGroups, tempWidgetsByGroup, widgetsByGroup],
	);

	// NOTE 실제 화면상에 출력되는 아이템 목록
	const combinedItems = useMemo(() => {
		if (!groups.size) return [];

		return closedGroups.size
			? [...allItems.values()].filter((item) => !closedWidgets.has(item.i))
			: [...allItems.values()];
	}, [allItems, closedGroups.size, closedWidgets, groups.size]);

	// NOTE 레이아웃
	const [layouts, changeLayouts] = useState<Layouts>({});
	// NOTE 현재 레이아웃 타입(lg | md | sm | xs | xxs)
	// const breakpointRef = useRef<string>("");

	// NOTE 신규 추가 아이템에 부여되는 유니크한 아이디 값
	const itemIdRef = useRef<string>("0");

	// NOTE 위젯 아이디로 소속 그룹의 아이디 찾는 함수
	const getGroupId = useCallback(
		({ widgetId }: { widgetId: string }): string =>
			[...widgetsByGroup]
				.find(([, widgetIds]) => widgetIds.has(widgetId))
				?.shift() as string,
		[widgetsByGroup],
	);

	// NOTE 레이아웃 변동될 때 처리
	const onLayoutChange = useCallback(() => {
		changeLayouts({});

		changeLayouts({
			lg: combinedItems,
			md: combinedItems,
			sm: combinedItems,
		});
	}, [combinedItems]);

	// NOTE 그룹 collapse
	const onClickGroupCollapse = useCallback(
		({ groupId, groupY }: { groupId: string; groupY: number }) => {
			// y값 변경 함수
			const changeYvalues =
				({
					isOpen,
					groupMaxHeight,
				}: {
					isOpen: boolean;
					groupMaxHeight: number;
				}) =>
				(allItems: Map<string, ItemProps>) => {
					allItems = new Map(allItems);

					// 현재 닫기/열기 하고 있는 그룹 소속 위젯들은 그룹보다 y값이 크지만 같이 업데이트하면 안됨
					const allItemsExceptClosedWidgets = [...allItems.values()].filter(
						({ i }) => !widgetsByGroup.get(groupId)?.has(i),
					);

					allItemsExceptClosedWidgets.forEach(({ i, y }) => {
						const currentItem = allItems.get(i) as ItemProps;

						// 그룹 드래그 가능 여부 처리
						i === groupId &&
							allItems.set(i, {
								...currentItem,
								isDraggable: !isOpen,
							});

						// 현재 collapse 처리되고 있는 그룹 뒤에 있는 아이템들의 y값 처리
						y > groupY &&
							allItems.set(i, {
								...currentItem,
								y: isOpen
									? currentItem.y + groupMaxHeight
									: currentItem.y - groupMaxHeight,
							});
					});

					return allItems;
				};

			const collapseGroups = new Map(closedGroups);

			// 닫혀있는 그룹을 다시 오픈하는 경우
			if (closedGroups.has(groupId)) {
				const { groupMaxHeight } = closedGroups.get(groupId) as {
					groupMaxHeight: number;
				};

				tempWidgetsByGroup.has(groupId) &&
					changeTempWidgetsByGroup((temp) => {
						temp.delete(groupId);
						return temp;
					});

				// 하위 위젯이 있는 경우 오픈 그룹 보다 y값이 큰 아이템 모두 y값 업데이트 처리
				if (groupMaxHeight > 0) {
					changeAllItems(changeYvalues({ isOpen: true, groupMaxHeight }));
				} else {
					// 하위 위젯이 없는 경우 레이아웃 상태를 수동 업데이트 해야함
					changeAllItems((allItem) =>
						allItems.set(groupId, {
							...(allItem.get(groupId) as ItemProps),
							isDraggable: false,
						}),
					);

					const newCombinedItems = [...allItems.values()].filter(
						(item) => !closedWidgets.has(item.i),
					);

					changeLayouts({
						lg: newCombinedItems,
						md: newCombinedItems,
						sm: newCombinedItems,
					});
				}

				collapseGroups.delete(groupId);
			} else {
				// 그룹 닫기
				// 하위 위젯 존재 여부에 따른 그룹 높이 계산(그룹 재오픈했을 때 기준 값이 됨)
				const groupMaxHeight = widgetsByGroup.get(groupId)
					? Math.max.apply(
							null,
							[...(widgetsByGroup.get(groupId) as Set<string>)].map(
								(widgetId) => {
									const { y, h } = allItems.get(widgetId) as ItemProps;
									return y + h;
								},
							),
					  ) -
					  (groupY + 1)
					: 0;

				// 하위 그룹이 있는 경우 닫은 그룹 보다 y값이 큰 아이템 모두 y값 업데이트 처리
				if (groupMaxHeight > 0) {
					changeAllItems(changeYvalues({ isOpen: false, groupMaxHeight }));
				} else {
					// 하위 위젯이 없는 경우 레이아웃 상태를 수동 업데이트 해야함
					changeAllItems((allItem) =>
						allItems.set(groupId, {
							...(allItem.get(groupId) as ItemProps),
							isDraggable: true,
						}),
					);
				}
				const newCombinedItems = [...allItems.values()].filter(
					(item) => !closedWidgets.has(item.i),
				);

				changeLayouts({
					lg: newCombinedItems,
					md: newCombinedItems,
					sm: newCombinedItems,
				});

				collapseGroups.set(groupId, { groupMaxHeight });
			}

			changeClosedGroups(collapseGroups);
		},
		[allItems, closedGroups, closedWidgets, tempWidgetsByGroup, widgetsByGroup],
	);

	// NOTE 아이템 드래그 시 이동 가능한 영역인지 판단
	const isDraggableArea = useRef<boolean>(false);
	const onDrag = useCallback(
		(layout: Array<Layout>, originItem, changedItem) => {
			// 드래그하고 있는 아이템이 그룹인 경우
			if (groups.has(originItem.i)) {
				const nextItem = layout.find(({ y }) => y === changedItem.y + 1);
				const nextItemId = nextItem ? nextItem.i : null;

				// 이동 가능한 최대 y값
				const maxYvalue =
					Math.max.apply(
						null,
						combinedItems.map(({ y, h }) => y + h),
					) - 1;

				// 드래그하고 있는 그룹 바로 아래에 있는 아이템이 그룹이거나 이동 위치가 최하단이면 드래그 가능 영역
				isDraggableArea.current =
					(nextItemId != null && groups.has(nextItemId)) ||
					changedItem.y > maxYvalue;

				return;
			}

			// 드래그하고 있는 아이템이 위젯인 경우 - 최상단 그룹보다 y값이 크기만 하면 드래그 가능 영역
			isDraggableArea.current = !!(changedItem.y > 0);
		},
		[combinedItems, groups],
	);

	// NOTE 아이템 이동 시 처리
	const onDragStop = useCallback(
		(layout: Array<Layout>, originItem, changedItem) => {
			// onDrag에서 드래그 불가 판정됐으면 리턴 처리
			if (!isDraggableArea.current) return;

			// 드래그가 끝났으로 드래그 가능 영역 체크 초기화 처리
			isDraggableArea.current = false;

			// -------------------------------

			const items = new Map(allItems);

			// 그룹 이동일 때
			if (groups.has(originItem.i)) {
				console.log("group!");
				// 변경된 y값 (최대 높이 제한)
				const currentItemY = Math.min(
					changedItem.y,
					Math.max.apply(
						null,
						layout
							.filter(({ i }) => i !== originItem.i)
							.map(({ y, h }) => y + h),
					),
				);

				layout.forEach((item) => {
					const itemId = item.i;
					const originValue = items.get(itemId) as ItemProps;
					const originY = originValue.y;

					// 현재 돌고 있는 item이 닫혀있는 그룹인 경우 하위 위젯 처리
					if (closedGroups.has(itemId) && widgetsByGroup.has(itemId)) {
						// const movedYvalue = currentItemY - originY;
						const movedYvalue =
							itemId === originItem.i
								? currentItemY - originY
								: item.y - originY;

						[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
							(widgetId) => {
								const { y: originY, ...widget } = items.get(
									widgetId,
								) as ItemProps;

								items.set(widgetId, { ...widget, y: originY + movedYvalue });
							},
						);
					}

					// 나머지 모든 아이템 변경 사항 저장
					itemId === originItem.i
						? items.set(itemId, { ...originValue, ...item, y: currentItemY })
						: items.set(itemId, { ...originValue, ...item });
				});
				// 그룹 이동 끝!
			} else {
				console.log("widget!");
				// 위젯 이동인 경우
				// 원 소속 그룹 ID
				const originGroupId = getGroupId({ widgetId: originItem.i });

				// 현 이동 위치의 그룹 파악
				const currentGroup = [...groups]
					.map((groupId) => layout.find(({ i }) => i === groupId) as ItemProps)
					.sort(({ y: a }, { y: b }) => b - a)
					.find(({ y }) => y < changedItem.y) as ItemProps;

				// 변경된 y값 (최대 높이 제한)
				const currentItemY = Math.min(
					changedItem.y,
					Math.max.apply(
						null,
						layout
							.filter(({ i }) => i !== originItem.i)
							.map(({ y, h }) => y + h),
					),
				);

				// 다른 그룹 && 닫혀있는 그룹으로 이동한 경우
				if (closedGroups.has(currentGroup.i)) {
					console.log("닫힌 그룹으로 이동");
					// const { groupMaxHeight } = closedGroups.get(currentGroup.i) as {
					// 	groupMaxHeight: number;
					// };

					// changeTempWidgets((widgets) => {
					// 	widgets = new Map(widgets);
					// 	widgets.set(originItem, i);
					// 	return widgets;
					// });
					changeTempWidgetsByGroup((tempWidgets) => {
						tempWidgets = new Map(tempWidgets);
						tempWidgets.has(currentGroup.i)
							? tempWidgets.set(
									currentGroup.i,
									(tempWidgets.get(currentGroup.i) as Set<string>).add(
										originItem.i,
									),
							  )
							: tempWidgets.set(currentGroup.i, new Set([originItem.i]));
						return tempWidgets;
					});

					// 이동하는 그룹 소속 위젯이 없을 때
					// if (groupMaxHeight === 0) {
					// 	layout.forEach((item) => {
					// 		console.log("하위 위젯 없음");
					// 		const itemId = item.i;
					// 		const originValue = items.get(itemId) as ItemProps;
					// 		const originY = originValue.y;

					// 		// 현재 돌고 있는 item이 닫혀있는 그룹인 경우 하위 위젯 처리
					// 		if (
					// 			originY !== item.y &&
					// 			closedGroups.has(itemId) &&
					// 			widgetsByGroup.has(itemId)
					// 		) {
					// 			const movedYvalue = originY - item.y;

					// 			[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
					// 				(widgetId) => {
					// 					const { y: originY, ...widget } = items.get(
					// 						widgetId,
					// 					) as ItemProps;

					// 					items.set(widgetId, {
					// 						...widget,
					// 						y: originY + movedYvalue,
					// 					});
					// 				},
					// 			);
					// 		}

					// 		// 나머지 모든 아이템 변경 사항 저장
					// 		item.i === currentGroup.i
					// 			? items.set(itemId, {
					// 					...originValue,
					// 					...item,
					// 					isDraggable: true,
					// 			  })
					// 			: item.i === originItem.i
					// 			? items.set(itemId, {
					// 					...originValue,
					// 					...item,
					// 					y: currentItemY,
					// 			  })
					// 			: items.set(itemId, { ...originValue, ...item });
					// 	});
					// } else {
					// 	console.log("하위 위젯 있음");
					// 	layout.forEach((item) => {
					// 		const itemId = item.i;
					// 		const originValue = items.get(itemId) as ItemProps;
					// 		const originY = originValue.y;

					// 		if (item.y > currentGroup.y && itemId !== originItem.i) {
					// 			console.log("이동 그룹보다 y값이 큰 경우!");
					// 			console.log("key: ", itemId);
					// 			console.log("y: ", item.y);
					// 			if (
					// 				originY !== item.y &&
					// 				closedGroups.has(itemId) &&
					// 				widgetsByGroup.has(itemId)
					// 			) {
					// 				const movedYvalue = originY - item.y;

					// 				[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
					// 					(widgetId) => {
					// 						const { y: originY, ...widget } = items.get(
					// 							widgetId,
					// 						) as ItemProps;

					// 						// items.set(widgetId, {
					// 						// 	...widget,
					// 						// 	y: originY + movedYvalue + groupMaxHeight,
					// 						// });
					// 						items.set(widgetId, {
					// 							...widget,
					// 							y: originY + movedYvalue,
					// 						});
					// 					},
					// 				);
					// 			}

					// 			console.log("item.y: ", item.y);
					// 			console.log("item.y+groupMaxHeight: ", item.y + groupMaxHeight);

					// 			// items.set(itemId, {
					// 			// 	...originValue,
					// 			// 	...item,
					// 			// 	y: item.y + groupMaxHeight,
					// 			// });
					// 			items.set(itemId, {
					// 				...originValue,
					// 				...item,
					// 			});
					// 		}
					// 		// else {
					// 		// 	// 나머지 모든 아이템 변경 사항 저장
					// 		// 	item.i === currentGroup.i
					// 		// 		? items.set(itemId, {
					// 		// 				...originValue,
					// 		// 				...item,
					// 		// 				isDraggable: true,
					// 		// 		  })
					// 		// 		: item.i === originItem.i
					// 		// 		? items.set(itemId, {
					// 		// 				...originValue,
					// 		// 				...item,
					// 		// 				y: currentItemY,
					// 		// 		  })
					// 		// 		: items.set(itemId, { ...originValue, ...item });
					// 		// }
					// 		item.i === currentGroup.i
					// 			? items.set(itemId, {
					// 					...originValue,
					// 					...item,
					// 					isDraggable: true,
					// 			  })
					// 			: item.i === originItem.i
					// 			? items.set(itemId, {
					// 					...originValue,
					// 					...item,
					// 					y: currentItemY,
					// 			  })
					// 			: items.set(itemId, { ...originValue, ...item });
					// 	});
					// }

					// changeClosedGroups((groups) => {
					// 	groups = new Map(groups);
					// 	groups.delete(currentGroup.i);
					// 	return groups;
					// });
				}
				// else {
				// 	console.log("닫힌 그룹 아님");

				// 	layout.forEach((item) => {
				// 		const itemId = item.i;
				// 		const originValue = items.get(itemId) as ItemProps;

				// 		item.i === originItem.i
				// 			? items.set(itemId, {
				// 					...originValue,
				// 					...item,
				// 					y: currentItemY,
				// 			  })
				// 			: items.set(itemId, { ...originValue, ...item });
				// 	});
				// }

				// 그룹 다르면 소속 그룹 변경 처리

				if (originGroupId !== currentGroup.i) {
					console.log("그룹 변경");
					// 그룹 변경
					changeWidgetsByGroup((widgetsByGroup) => {
						widgetsByGroup = new Map(widgetsByGroup);

						const originGroupWidgets = [
							...(widgetsByGroup.get(originGroupId) as Set<string>),
						].filter((widgetId) => widgetId !== originItem.i);

						const currentGroupWidgets = [
							...(widgetsByGroup.get(currentGroup.i) || new Set()),
							originItem.i,
						];

						widgetsByGroup.set(currentGroup.i, new Set(currentGroupWidgets));

						originGroupWidgets.length
							? widgetsByGroup.set(originGroupId, new Set(originGroupWidgets))
							: widgetsByGroup.delete(originGroupId);

						// originGroupWidgets.delete(originItem.i);
						// originGroupWidgets.size
						// 	? widgetsByGroup.set(originGroupId, originGroupWidgets)
						// 	: widgetsByGroup.delete(originGroupId);

						// const currentGroupWidgets =
						// 	widgetsByGroup.get(currentGroup.i) || new Set();

						// currentGroupWidgets.add(originItem.i);
						// widgetsByGroup.set(currentGroup.i, currentGroupWidgets);

						console.log(
							"🚀 ~ file: grid-container.tsx ~ line 646 ~ changeWidgetsByGroup ~ widgetsByGroup",
							widgetsByGroup,
						);
						return widgetsByGroup;
					});
				}

				layout.forEach((item) => {
					const itemId = item.i;
					const originValue = items.get(itemId) as ItemProps;
					const originY = originValue.y;

					// changedItem이 닫힌 그룹이면서 y값 변동이 있는 경우 수동으로 하위 위젯 y값도 변동값 반영해줘야 함
					if (closedGroups.has(itemId) && widgetsByGroup.has(itemId)) {
						const movedYvalue = originY - item.y;

						[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
							(widgetId) => {
								const { y: originY, ...widget } = allItems.get(
									widgetId,
								) as ItemProps;
								items.set(widgetId, { ...widget, y: originY + movedYvalue });
							},
						);
					}

					item.i === originItem.i
						? items.set(itemId, {
								...originValue,
								...item,
								y: currentItemY,
						  })
						: items.set(itemId, { ...originValue, ...item });
				});
			}

			// const newCombinedItems = [...items.values()].filter(
			// 	(item) => !closedWidgets.has(item.i),
			// );

			// changeLayouts({});

			// changeLayouts({
			// 	lg: newCombinedItems,
			// 	md: newCombinedItems,
			// 	sm: newCombinedItems,
			// });

			changeAllItems(items);
			// ---------------------------

			// layout.forEach((changedItem) => {
			// 	const itemId = changedItem.i;
			// 	const currentItem = items.get(itemId) as ItemProps;

			// 	// 변경된 y값 (최대 높이 제한)
			// 	const itemY = Math.min(
			// 		changedItem.y,
			// 		Math.max.apply(
			// 			null,
			// 			combinedItems.map(({ y, h }) => y + h),
			// 		),
			// 	);
			// });

			// --------------------------

			// // 위젯 이동인 경우
			// if (!groups.has(originItem.i)) {
			// 	// 원 소속 그룹 ID
			// 	const originGroupId = getGroupId({ widgetId: originItem.i });

			// 	// 현 이동 위치의 그룹 파악
			// 	const currentGroup = [...groups]
			// 		.map((groupId) => layout.find(({ i }) => i === groupId) as ItemProps)
			// 		.sort(({ y: a }, { y: b }) => b - a)
			// 		.find(({ y }) => y < changedItem.y) as ItemProps;

			// 	// 그룹 ID 다르면 소속 그룹 변경 처리
			// 	if (originGroupId !== currentGroup.i) {
			// 		// 그룹 변경
			// 		changeWidgetsByGroup((widgetsByGroup) => {
			// 			widgetsByGroup = new Map(widgetsByGroup);

			// 			const originGroupWidgets = widgetsByGroup.get(
			// 				originGroupId,
			// 			) as Set<string>;

			// 			originGroupWidgets.delete(originItem.i);
			// 			originGroupWidgets.size
			// 				? widgetsByGroup.set(originGroupId, originGroupWidgets)
			// 				: widgetsByGroup.delete(originGroupId);

			// 			const currentGroupWidgets =
			// 				widgetsByGroup.get(currentGroup.i) || new Set();

			// 			currentGroupWidgets.add(originItem.i);
			// 			widgetsByGroup.set(currentGroup.i, currentGroupWidgets);

			// 			return widgetsByGroup;
			// 		});

			// 		// 상태 저장
			// 		changeAllItems((allItems) => {
			// 			allItems = new Map(allItems);
			// 			layout.forEach((item) =>
			// 				allItems.set(item.i, {
			// 					...(allItems.get(item.i) as ItemProps),
			// 					...item,
			// 				}),
			// 			);
			// 			return allItems;
			// 		});

			// 		// 이동한 그룹이 닫힌 그룹일 때는 오픈 처리함
			// 		if (closedGroups.has(currentGroup.i))
			// 			onClickGroupCollapse({
			// 				groupId: currentGroup.i,
			// 				groupY: currentGroup.y,
			// 			});

			// 		return;
			// 	}

			// 	// 원 그룹 내 이동인 경우

			// 	// 그룹 소속 위젯 IDs
			// 	const widgetIds = widgetsByGroup.get(originGroupId) as Set<string>;

			// 	// 그룹의 원래 높이
			// 	const originGroupHeight = Math.max.apply(
			// 		null,
			// 		[...widgetIds].map((widgetId) => {
			// 			const { y, h } = allItems.get(widgetId) as ItemProps;
			// 			return y + h;
			// 		}),
			// 	);

			// 	// 현재 그룹 높이 체크
			// 	const currentGroupHeight = Math.max.apply(
			// 		null,
			// 		[...widgetIds].map((widgetId) => {
			// 			const { y, h } = layout.find(
			// 				({ i }) => i === widgetId,
			// 			) as ItemProps;
			// 			return y + h;
			// 		}),
			// 	);

			// 	// 그룹 높이가 같으면 y값 변동이 없으므로 현재 위젯 상태만 업데이트 함
			// 	if (originGroupHeight === currentGroupHeight)
			// 		return changeAllItems((allItems) => {
			// 			allItems = new Map(allItems);

			// 			const widgetId = changedItem.i;

			// 			allItems.set(widgetId, {
			// 				...(allItems.get(widgetId) as ItemProps),
			// 				...changedItem,
			// 			});

			// 			return allItems;
			// 		});
			// }

			// // 그룹 이동 또는 위젯이지만 그룹 변동 없고 내부 높이가 달라진 경우
			// changeAllItems((allItems) => {
			// 	allItems = new Map(allItems);

			// 	layout.forEach((changedItem) => {
			// 		const itemId = changedItem.i;
			// 		const originItem = allItems.get(itemId) as ItemProps;

			// 		// 변경된 y값 (최대 높이 제한)
			// 		const itemY = Math.min(
			// 			changedItem.y,
			// 			Math.max.apply(
			// 				null,
			// 				combinedItems.map(({ y, h }) => y + h),
			// 			),
			// 		);

			// 		// changedItem이 닫힌 그룹이면서 y값 변동이 있는 경우 수동으로 하위 위젯 y값도 변동값 반영해줘야 함
			// 		if (
			// 			closedGroups.has(itemId) &&
			// 			originItem.y !== itemY &&
			// 			widgetsByGroup.has(itemId)
			// 		) {
			// 			const movedYvalue = itemY - originItem.y;

			// 			[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
			// 				(widgetId) => {
			// 					const { y: originY, ...widget } = allItems.get(
			// 						widgetId,
			// 					) as ItemProps;
			// 					allItems.set(widgetId, { ...widget, y: originY + movedYvalue });
			// 				},
			// 			);
			// 		}

			// 		// 변경된 값 모두 반영
			// 		allItems.set(itemId, { ...originItem, ...changedItem, y: itemY });
			// 	});

			// 	return allItems;
			// });
		},
		[allItems, closedGroups, getGroupId, groups, widgetsByGroup],
	);

	// NOTE 위젯 사이즈 변경 시 처리
	const onResizeStop = useCallback(
		(layout: Array<Layout>, resizeWidget) =>
			changeAllItems((allItems) => {
				allItems = new Map(allItems);

				layout.forEach((changedItem) => {
					const itemId = changedItem.i;
					const originItem = allItems.get(itemId) as ItemProps;

					// changedItem이 닫힌 그룹이면서 리사이즈 위젯보다 y값이 큰 경우 수동으로 그룹 하위 위젯 y값도 변동값 반영해줘야함
					if (
						closedGroups.has(itemId) &&
						resizeWidget.y < originItem.y &&
						widgetsByGroup.has(itemId)
					) {
						const movedYvalue = changedItem.y - originItem.y;

						[...(widgetsByGroup.get(itemId) as Set<string>)].forEach(
							(widgetId) => {
								const { y: originY, ...widget } = allItems.get(
									widgetId,
								) as ItemProps;
								allItems.set(widgetId, { ...widget, y: originY + movedYvalue });
							},
						);
					}

					// 변경된 값 모두 반영
					allItems.set(itemId, { ...originItem, ...changedItem });
				});

				return allItems;
			}),
		[closedGroups, widgetsByGroup],
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

	// NOTE 그룹 추가
	const onClickAddGroup = useCallback(() => {
		const itemId = `${Number(itemIdRef.current) + 1}`;
		changeAllItems((allItems) => {
			allItems = new Map(allItems);

			[...allItems.values()].forEach((item) =>
				allItems.set(item.i, { ...item, y: item.y + 1 }),
			);

			allItems.set(itemId, {
				name: `New Group - ${itemId}`,
				isGroup: true,
				i: itemId,
				x: 0,
				y: 0,
				w: 8,
				h: 1,
				isDraggable: false,
				isResizable: false,
			});

			return allItems;
		});

		changeGroups((groups) => groups.add(itemId));

		itemIdRef.current = itemId;
	}, []);

	// NOTE 컴포넌트 너비 변동으로 레이아웃 타입이 변경될 때마다 레이아웃 타입 저장 <- 필요하면 활성
	// const onBreakpointChange = useCallback(
	// 	(layoutType) => (breakpointRef.current = layoutType),
	// 	[],
	// );

	// NOTE 초기 데이터가 있는 경우 아이템을 전체 아이템/그룹/그룹 소속 위젯으로 상태 구분 처리 - 최초 한번만 실행하도록
	useEffect(() => {
		if (!INIT_ITEMS.length) return;

		const groups: Map<string, ItemProps> = new Map();
		const widgets: Map<string, ItemProps> = new Map();

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
		 *
		 * *** API res 속성에서 그룹 파악이 가능하다면 이 함수는 굳이 필요없음
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

		changeAllItems(initItems);
		changeGroups(new Set([...groups.keys()]));
		changeWidgetsByGroup(widgetsByGroup);
		itemIdRef.current = initItems.size
			? `${Math.max.apply(
					null,
					[...initItems.keys()].map((stringId) => Number(stringId)),
			  )}`
			: `0`;
	}, []);

	console.log("allItems: ", allItems);

	return (
		<Container>
			<ToolbarArea>
				<div style={{ display: "flex", alignItems: "center" }}>Toolbar</div>
				<div
					style={{ border: "1px solid", padding: "4px", cursor: "pointer" }}
					onClick={onClickAddGroup}
				>
					+++
				</div>
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
					// onBreakpointChange={onBreakpointChange}
					onResizeStop={onResizeStop}
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
											y: {y} - {name} - key: {itemId}
										</div>
										{!groups.has(itemId) && (
											<div
												style={{
													border: "1px solid",
													padding: "2px",
													cursor: "pointer",
												}}
												onClick={() =>
													onClickDeleteWidget({ widgetId: itemId })
												}
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
