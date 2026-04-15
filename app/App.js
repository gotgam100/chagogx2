import { StatusBar } from 'expo-status-bar';
import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Alert, Animated, Dimensions, Image, StyleSheet, PanResponder } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

import { C, LEVEL_NAMES, LEVEL_COLORS } from './constants';
import {
  INITIAL_HIERARCHY, getItemsAtPath, getLabelById, getNodeById, findNodeById, updateNodeQty,
  updateNodeAtPath, addNodeAtPath, insertNodeAfter, deleteNodeAtPath, searchHierarchy, getAllItems, reorderNodeChildren, getMoveTargets, getNodeDepth, ensureLevels, findParentPathById,
} from './data';
import { CategoryCard, ItemCard, NavTab, ActionModal, CategoryModal, ItemModal, QtyInputModal, SearchModal, MoveModal, MemoModal, InventoryView, SettingsView, ViewerView, HierarchySortableGrid, SpaceModelPlayground } from './components';
import { hierarchyToSpaceTree, spaceTreeToHierarchy } from './spaceModel';
import S from './styles';
import * as Font from 'expo-font';

const STORAGE_KEY = 'CHAGOK_HIERARCHY_V1';
const BACKUP_KEY = 'CHAGOK_HIERARCHY_BACKUP';
const RECENT_ICONS_KEY = 'CHAGOK_RECENT_ICONS';
const COLS_BY_LEVEL_KEY = 'CHAGOK_COLS_BY_LEVEL';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const GRID_W = SCREEN_W - H_PAD * 2;
const IS_TABLET = SCREEN_W >= 768;
const DEFAULT_COLS = IS_TABLET ? 4 : 3;
const CARD_W = GRID_W * 0.305;
const CARD_H = CARD_W * (5 / 4);

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    'Galmuri7': require('./assets/fonts/Galmuri7.ttf'),
  });

  const [hierarchy, setHierarchy] = useState(INITIAL_HIERARCHY);
  const [path, setPath] = useState([]);
  const slideX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;


  const bodyRef = useRef(null);
  const pathRef = useRef([]);

  // Action sheet
  const [actionTarget, setActionTarget] = useState(null);

  // Move modal
  const [moveModal, setMoveModal] = useState({ visible: false, targets: [] });

  // Category modal
  const [catModal, setCatModal] = useState({ visible: false, mode: 'add', targetLevel: 0, editId: null, label: '', icon: 'category', photoUri: null });
  const [itemModal, setItemModal] = useState({ visible: false, mode: 'add', targetLevel: 3, editId: null, label: '', icon: 'category', photoUri: null, qty: 1 });

  // Search
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memoModal, setMemoModal] = useState({ visible: false, targetId: null, label: '', memo: '' });
  const searchResults = searchHierarchy(hierarchy, searchQuery);

  // Inventory
  const allItems = getAllItems(hierarchy);

  // Tab
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'inventory' | 'notice' | 'settings'

  // FAB
  const [fabOpen, setFabOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    Animated.spring(fabAnim, { toValue, useNativeDriver: true, tension: 80, friction: 10 }).start();
    setFabOpen(v => !v);
  };
  const closeFab = () => {
    Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    setFabOpen(false);
  };

  // Recent icons
  const [recentIcons, setRecentIcons] = useState([]);
  const [colsByLevel, setColsByLevel] = useState({ 0: DEFAULT_COLS, 1: DEFAULT_COLS, 2: DEFAULT_COLS, 3: DEFAULT_COLS });
  const addToRecent = (ic) => setRecentIcons(prev => {
    const next = [ic, ...prev.filter(x => x !== ic)].slice(0, 10);
    AsyncStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(next)).catch(() => {});
    return next;
  });

  const level = path.length;
  const LC = LEVEL_COLORS[Math.min(level, 3)];
  const items = getItemsAtPath(hierarchy, path);
  const crumbs = [{ label: '홈', sliceIndex: 0 }];
  path.forEach((id, index) => {
    const node = getNodeById(hierarchy, id);
    if (!node?.none) {
      crumbs.push({ label: node?.label ?? id, sliceIndex: index + 1 });
    }
  });
  const sectionLabel = level === 0
    ? '공간별 카테고리'
    : `${getLabelById(hierarchy, path[path.length - 1]) ?? path[path.length - 1]}의 ${LEVEL_NAMES[level]}`;

  // Keep ref in sync for swipeGesture closure
  useEffect(() => { pathRef.current = path; }, [path]);

  // ── Persistence ────────────────────────────────────────────────────────────
  // Auto-load on boot
  const [isLoaded, setIsLoaded] = useState(false);

  // OTA 업데이트 즉시 적용
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {}
    })();
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          // 레벨 마이그레이션 수행
          setHierarchy(ensureLevels(parsed));
        }
        const savedIcons = await AsyncStorage.getItem(RECENT_ICONS_KEY);
        if (savedIcons !== null) setRecentIcons(JSON.parse(savedIcons));
        const savedCols = await AsyncStorage.getItem(COLS_BY_LEVEL_KEY);
        if (savedCols !== null) setColsByLevel(JSON.parse(savedCols));
      } catch (e) {
        console.error('Failed to load storage:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Auto-save on change (Only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hierarchy));
      } catch (e) {
        console.error('Failed to save hierarchy:', e);
      }
    })();
  }, [hierarchy, isLoaded]);

  // Explicit Backup/Restore (Manual File selection)
  const handleBackupLocal = async () => {
    try {
      const dataStr = JSON.stringify(hierarchy, null, 2);
      const filename = `chagok_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, dataStr);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: '백업 파일 저장 경로 선택',
          UTI: 'public.json'
        });
      } else {
        Alert.alert('오류', '이 기기에서는 파일 공유를 사용할 수 없습니다.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('백업 실패', '파일 생성 중 오류가 발생했습니다.\n' + e.message);
    }
  };

  const handleRestoreLocal = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const parsed = JSON.parse(content);

      if (!Array.isArray(parsed)) {
        throw new Error('올바른 백업 파일 형식이 아닙니다.');
      }

      Alert.alert('데이터 복구', '선택한 파일의 정보로 복구할까요? 현재 정보는 모두 삭제됩니다.', [
        { text: '취소', style: 'cancel' },
        {
          text: '복구', style: 'destructive', onPress: () => {
            setHierarchy(parsed);
            Alert.alert('완료', '데이터 복구가 완료되었습니다.');
          }
        },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('불러오기 실패', '파일을 읽는 중 오류가 발생했습니다.\n' + e.message);
    }
  };

  // ── Swipe Navigation ────────────────────────────────────────────────────────
  const navigateTo = (newPath) => {
    Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      slideX.setValue(0);
      setPath(newPath);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx > 0 && pathRef.current.length > 0)
          slideX.setValue(Math.min(g.dx * 0.3, 70));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 && pathRef.current.length > 0) {
          navigateTo(pathRef.current.slice(0, -1));
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;
  const swipePanHandlers = swipePanResponder.panHandlers;

  // ── Card handlers ────────────────────────────────────────────────────────────
  const isItemNode = (item) => item.quantity !== undefined;

  const handleCardPress = (item) => {
    if (!isItemNode(item) && level < 3) setPath([...path, item.id]);
  };

  const handleMenuPress = (item) => {
    if (item.none) return;
    setActionTarget(item);
  };

  // Action sheet: 수정
  const handleEdit = () => {
    const item = actionTarget;
    setActionTarget(null);
    setTimeout(() => {
      if (isItemNode(item) || item.level === 3) {
        setItemModal({ visible: true, mode: 'edit', targetLevel: 3, editId: item.id, label: item.label, icon: item.icon || 'category', photoUri: item.photoUri || null, qty: item.quantity ?? 1 });
      } else {
        setCatModal({ visible: true, mode: 'edit', targetLevel: item.level ?? 0, editId: item.id, label: item.label, icon: item.icon || 'category', photoUri: item.photoUri || null });
      }
    }, 50);
  };

  // Action sheet: 이동
  const handleMove = () => {
    const item = actionTarget;
    setActionTarget(null);
    const itemIsLeaf = isItemNode(item);
    // 현재 보고 있는 path가 아닌, 아이템의 실제 부모 경로를 찾음
    const sourcePath = findParentPathById(hierarchy, item.id) || [];
    const targets = getMoveTargets(hierarchy, itemIsLeaf, sourcePath);
    setTimeout(() => {
      setMoveModal({ visible: true, targets, item, sourcePath });
    }, 50);
  };

  // Action sheet: 메모
  const handleMemo = () => {
    const item = actionTarget;
    setActionTarget(null);
    setMemoModal({
      visible: true,
      targetId: item.id,
      label: item.label,
      memo: item.memo || ''
    });
  };

  const handleSaveMemo = (text) => {
    setHierarchy(h => updateNodeAtPath(h, path, memoModal.targetId, { memo: text }));
    setMemoModal(m => ({ ...m, visible: false }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // 수량 직접 변경 핸들러
  const handleUpdateQty = (nodeId, direction) => {
    const node = findNodeById(hierarchy, nodeId);
    if (!node || node.quantity === undefined) return;

    const currentQty = node.quantity ?? 1;
    const newQty = currentQty + direction;

    if (newQty <= 0) {
      // 삭제 확인창
      Alert.alert(
        '물건 삭제',
        `'${node.label}' 물건을 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: () => {
              setHierarchy(prev => deleteNodeAtPath(prev, path, nodeId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            }
          },
        ]
      );
      return;
    }

    // 일반 증감
    setHierarchy(prev => updateNodeQty(prev, nodeId, newQty));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // 수동 수량 관리 상태
  const [qtyModalForCard, setQtyModalForCard] = useState({ visible: false, nodeId: null, label: '', currentQty: 1 });

  const handleManualQty = (nodeId) => {
    const node = findNodeById(hierarchy, nodeId);
    if (!node) return;
    setQtyModalForCard({
      visible: true,
      nodeId: node.id,
      label: node.label,
      currentQty: node.quantity ?? 1
    });
  };

  // Action sheet: 복제
  const handleDuplicate = () => {
    const item = actionTarget;
    setActionTarget(null);
    const ts = Date.now();

    // 더 안정적인 복제 이름 생성 로직: 비어있는 가장 빠른 번호를 찾아 할당
    const siblings = getItemsAtPath(hierarchy, path);
    const siblingLabels = new Set(siblings.map(s => s.label));

    // "이름 2", "이름 3"... 형식으로 중복되지 않는 이름(첫번째 빈 숫자) 찾기
    const baseLabel = item.label.replace(/ \d+$/, '').trim();
    let newLabel = '';
    let num = 2;

    while (true) {
      const potentialLabel = `${baseLabel} ${num}`;
      if (!siblingLabels.has(potentialLabel)) {
        newLabel = potentialLabel;
        break;
      }
      num++;
    }

    // 하위는 없음 기본값(가구/구획 레벨용)만 유지
    let children = [];
    if (level === 0) {
      const noneId = `node-${ts}-none`;
      children = [{
        id: noneId, icon: '∅', none: true, label: '가구 없음', level: 1, children: [
          { id: `${noneId}-none`, icon: '∅', none: true, label: '구획 없음', level: 2, children: [] },
        ]
      }];
    } else if (level === 1) {
      children = [{ id: `node-${ts}-none`, icon: '∅', none: true, label: '구획 없음', level: 2, children: [] }];
    }

    const cloned = {
      ...item,
      id: `${item.id}-copy-${ts}`,
      label: newLabel,
      children,
    };
    setHierarchy(h => insertNodeAfter(h, path, item.id, cloned));
  };

  // Action sheet: 삭제
  const handleDelete = () => {
    const item = actionTarget;
    setActionTarget(null);
    Alert.alert('삭제 확인', `'${item.label}'을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: () => {
          setHierarchy(h => deleteNodeAtPath(h, path, item.id));
        }
      },
    ]);
  };

  // Quantity controls (level 3)
  const handleIncrement = (item) => {
    setHierarchy(h => updateNodeAtPath(h, path, item.id, { quantity: (item.quantity ?? 1) + 1 }));
  };
  const handleDecrement = (item) => {
    if ((item.quantity ?? 1) <= 1) {
      Alert.alert('삭제 확인', `'${item.label}'을(를) 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive', onPress: () => {
            setHierarchy(h => deleteNodeAtPath(h, path, item.id));
          }
        },
      ]);
    } else {
      setHierarchy(h => updateNodeAtPath(h, path, item.id, { quantity: (item.quantity ?? 1) - 1 }));
    }
  };

  // Add button
  const handleAdd = () => {
    if (level === 3) {
      setItemModal({ visible: true, mode: 'add', targetLevel: 3, editId: null, label: '', icon: 'category', photoUri: null, qty: 1 });
    } else {
      setCatModal({ visible: true, mode: 'add', targetLevel: level, editId: null, label: '', icon: 'category', photoUri: null });
    }
  };

  // Save category
  const handleSaveCategory = () => {
    if (!catModal.label.trim()) return;
    addToRecent(catModal.icon);
    if (catModal.mode === 'add') {
      const ts = Date.now();
      const nodeId = `node-${ts}`;
      // level 0 (공간) → '가구 없음' + 그 안에 '구획 없음' 자동 추가
      // level 1 (가구) → '구획 없음' 자동 추가
      let children = [];
      if (level === 0) {
        const noneId = `${nodeId}-none`;
        children = [{
          id: noneId, icon: '∅', none: true, label: '가구 없음', level: 1, children: [
            { id: `${noneId}-none`, icon: '∅', none: true, label: '구획 없음', level: 2, children: [] },
          ]
        }];
      } else if (level === 1) {
        children = [{ id: `${nodeId}-none`, icon: '∅', none: true, label: '구획 없음', level: 2, children: [] }];
      }
      const node = { id: nodeId, icon: catModal.icon, photoUri: catModal.photoUri, label: catModal.label.trim(), level: catModal.targetLevel, children };
      setHierarchy(h => addNodeAtPath(h, path, node));
    } else {
      setHierarchy(h => updateNodeAtPath(h, path, catModal.editId, { label: catModal.label.trim(), icon: catModal.icon, photoUri: catModal.photoUri }));
    }
    setCatModal(m => ({ ...m, visible: false }));
  };

  // Save item
  const handleSaveItem = () => {
    if (!itemModal.label.trim()) return;
    addToRecent(itemModal.icon);
    if (itemModal.mode === 'add') {
      const item = { id: `item-${Date.now()}`, icon: itemModal.icon, photoUri: itemModal.photoUri, label: itemModal.label.trim(), quantity: itemModal.qty, level: 3 };
      setHierarchy(h => addNodeAtPath(h, path, item));
    } else {
      setHierarchy(h => updateNodeAtPath(h, path, itemModal.editId, { label: itemModal.label.trim(), icon: itemModal.icon, photoUri: itemModal.photoUri, quantity: itemModal.qty }));
    }
    setItemModal(m => ({ ...m, visible: false }));
  };


  // ── Section header (shared) ──────────────────────────────────────────────────
  const sectionHeader = (
    <View style={S.sectionHeader}>
      <View style={S.sectionTitleRow}>
        <View style={[S.levelPill, { backgroundColor: LC.pill }]}>
          <Text style={[S.levelPillText, { color: LC.accent }]}>{LEVEL_NAMES[level]}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          style={[S.addBtn, { backgroundColor: LC.pill + '80' }]}
          onPress={() => setColsByLevel(prev => {
              const cur = prev[level] ?? DEFAULT_COLS;
              const next = { ...prev, [level]: cur === DEFAULT_COLS ? DEFAULT_COLS - 1 : DEFAULT_COLS };
              AsyncStorage.setItem(COLS_BY_LEVEL_KEY, JSON.stringify(next)).catch(() => {});
              return next;
            })}
        >
          <Text style={{ fontSize: 14, color: LC.accent }}>{(colsByLevel[level] ?? DEFAULT_COLS) === DEFAULT_COLS ? '⊞' : '▦'}</Text>
          <Text style={[S.addBtnText, { color: LC.accent }]}>크기 조절</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.addBtn, { backgroundColor: LC.pill + '80' }]} onPress={handleAdd}>
          <Text style={{ fontSize: 16, color: LC.accent }}>+</Text>
          <Text style={[S.addBtnText, { color: LC.accent }]}>{LEVEL_NAMES[level]} 추가</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={S.root}>
          <StatusBar style="dark" />
          {!fontsLoaded ? null : (
            <>
              {/* ── Header ── */}
              <View style={[S.header, { paddingBottom: 10 }]}>
                <View style={S.headerTop}>
                  <View style={S.headerLeft}>
                    <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                      <Image
                        source={require('./assets/New Piskel3 (2).png')}
                        style={{ width: 28, height: 28 }}
                        resizeMode="contain"
                        fadeDuration={0}
                      />
                    </View>
                    <Text style={[S.headerTitle, { fontFamily: 'Galmuri7', fontSize: 24, paddingBottom: 2, paddingRight: 4 }]}>차곡차곡</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={S.iconBtn} onPress={() => { setSearchQuery(''); setSearchVisible(true); }}>
                      <Text style={{ fontSize: 20 }}>🔍</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ── Breadcrumb (홈 탭에서만 표시) ── */}
              {activeTab === 'home' && (
                <View style={{
                  backgroundColor: C.navBg,
                  paddingHorizontal: 16, paddingVertical: 6,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: C.outlineVariant + '40',
                }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={S.breadcrumb}>
                      {crumbs.map((crumb, i) => {
                        const crumbLevel = Math.min(i, 3);
                        const crumbLC = LEVEL_COLORS[crumbLevel];
                        const isLast = i === crumbs.length - 1;
                        return (
                          <View key={i} style={S.crumbRow}>
                            {i > 0 && <Text style={{ fontSize: 16, marginHorizontal: 4, color: C.onSurfaceVariant }}>›</Text>}
                            <TouchableOpacity onPress={() => setPath(path.slice(0, crumb.sliceIndex))}>
                              <Text style={[S.crumbText, isLast && [S.crumbActive, { color: crumbLC.accent }]]}>{crumb.label}</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* ── Body ── */}
              {activeTab === 'viewer' ? (
                <ViewerView 
                  hierarchy={hierarchy} 
                  onSaveHierarchy={setHierarchy} 
                  onNavigate={(itemPath, itemLevel) => {
                    // 카테고리는 자신의 경로로, 물건은 부모의 경로로 이동
                    const targetPath = (itemLevel === 3) ? itemPath.slice(0, -1) : itemPath;
                    setPath(targetPath);
                    setActiveTab('home');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  }} 
                />
              ) : activeTab === 'playground' ? (
                <SpaceModelPlayground />
              ) : activeTab === 'settings' ? (
                <SettingsView
                  hierarchy={hierarchy}
                  onReset={() => setHierarchy(INITIAL_HIERARCHY)}
                  onBackupLocal={handleBackupLocal}
                  onRestoreLocal={handleRestoreLocal}
                />
              ) : activeTab === 'inventory' ? (
                <InventoryView
                  items={[...allItems].reverse()}
                  onItemPress={(item) => {
                    setActiveTab('home');
                    if (item.pathIds) setPath(item.pathIds);
                  }}
                  onUpdateQty={handleUpdateQty}
                  onManualQty={handleManualQty}
                />
              ) : (
                <Animated.View
                  ref={bodyRef}
                  style={{ flex: 1, opacity, transform: [{ translateX: slideX }], backgroundColor: LC.screenBg }}
                  {...swipePanHandlers}
                >
                  {/* 섹션 헤더 */}
                  <View style={[S.section, { paddingHorizontal: 16, paddingTop: 20 }]}>
                    {sectionHeader}
                  </View>

                  {items.length > 0 ? (
                    <ScrollView
                      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
                      showsVerticalScrollIndicator={false}
                    >
                    <HierarchySortableGrid
                      numColumns={colsByLevel[level] ?? 3}
                      itemHeight={(GRID_W / (colsByLevel[level] ?? 3)) * (5 / 4)}
                      data={items.map(item => ({
                        ...item,
                        key: item.id
                      }))}
                      onItemPress={(item) => handleCardPress(item)}
                      onItemLongPress={(item) => handleMenuPress(item)}
                      onUpdateQty={handleUpdateQty}
                      onManualQty={handleManualQty}
                      renderItem={(item) => {
                        const itemLevel = item.level ?? 3;
                        const cols = colsByLevel[level] ?? 3;
                        return (itemLevel === 3 || isItemNode(item)) ? (
                          <ItemCard
                            item={item}
                            level={itemLevel}
                            numColumns={cols}
                            onMenuPress={() => handleMenuPress(item)}
                            onUpdateQty={handleUpdateQty}
                            onManualQty={handleManualQty}
                          />
                        ) : (
                          <CategoryCard
                            item={item}
                            level={itemLevel}
                            numColumns={cols}
                            onMenuPress={() => handleMenuPress(item)}
                          />
                        );
                      }}
                    />
                    </ScrollView>
                  ) : (
                    <View style={S.emptyState}>
                      <Text style={{ fontSize: 48 }}>📦</Text>
                      <Text style={S.emptyText}>등록된 항목이 없어요</Text>
                      <Text style={S.emptySub}>{LEVEL_NAMES[level]}을 추가해보세요</Text>
                    </View>
                  )}
                </Animated.View>
              )}

              {/* ── Bottom Nav ── */}
              <View style={S.bottomNav}>
                <NavTab icon="home" label="홈" isActive={activeTab === 'home'} onPress={() => { setPath([]); setActiveTab('home'); }} />
                <NavTab icon="🗂️" label="정리" isActive={activeTab === 'viewer'} onPress={() => setActiveTab('viewer')} />
                <NavTab icon="inventory-2" label="물건들" isActive={activeTab === 'inventory'} onPress={() => setActiveTab('inventory')} />
                <NavTab icon="🔬" label="실험실" isActive={activeTab === 'playground'} onPress={() => setActiveTab('playground')} />
                <NavTab icon="settings" label="설정" isActive={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
              </View>

              {/* ── FAB (홈 탭에서만) ── */}
              {activeTab === 'home' && (() => {
                const fabItems = [
                  { label: '물건 추가', levelIdx: 3, pathIds: path.slice(0, 3) },
                  { label: '구획 추가', levelIdx: 2, pathIds: path.slice(0, 2) },
                  { label: '가구 추가', levelIdx: 1, pathIds: path.slice(0, 1) },
                  { label: '공간 추가', levelIdx: 0, pathIds: [] },
                ];

                return (
                  <>
                    {/* 배경 딤 */}
                    {fabOpen && (
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.25)' }}
                        activeOpacity={1}
                        onPress={closeFab}
                      />
                    )}

                    {/* FAB 메뉴 아이템들 — 작은 버튼 중심을 큰 버튼 중심(right:49)에 맞춤 */}
                    {fabItems.map((fi, idx) => {
                      const translateY = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
                      const opacity2 = fabAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
                      // 큰버튼 중심 right:49, 작은버튼 width:44 → right:27
                      const itemBottom = 246 + idx * 60;
                      return (
                        <Animated.View
                          key={fi.label}
                          style={{
                            position: 'absolute', bottom: itemBottom, right: 27,
                            flexDirection: 'row', alignItems: 'center',
                            opacity: opacity2, transform: [{ translateY }]
                          }}
                          pointerEvents={fabOpen ? 'auto' : 'none'}
                        >
                          {/* 라벨 — 버튼 왼쪽에 배치 */}
                          <View style={{
                            marginRight: 12,
                            backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8,
                            borderRadius: 20,
                            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
                          }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: C.onSurface }}>{fi.label}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              closeFab();
                              setTimeout(() => {
                                if (fi.levelIdx === 3) {
                                  setPath(fi.pathIds);
                                  setItemModal({ visible: true, mode: 'add', targetLevel: 3, editId: null, label: '', icon: 'category', photoUri: null, qty: 1 });
                                } else {
                                  setPath(fi.pathIds);
                                  setCatModal({ visible: true, mode: 'add', targetLevel: fi.levelIdx, editId: null, label: '', memo: '', icon: 'category', photoUri: null });
                                }
                              }, 50);
                            }}
                            style={{
                              width: 44, height: 44, borderRadius: 22,
                              backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
                              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.18, shadowRadius: 6, elevation: 5,
                            }}
                          >
                            <Text style={{ fontSize: 22, color: '#fff', lineHeight: 26 }}>+</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}

                    {/* 메인 FAB 버튼 */}
                    <TouchableOpacity
                      onPress={toggleFab}
                      activeOpacity={0.85}
                      style={{
                        position: 'absolute', bottom: 168, right: 20,
                        width: 58, height: 58, borderRadius: 29,
                        backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
                      }}
                    >
                      <Animated.Text style={{
                        fontSize: 28, color: '#fff', lineHeight: 34,
                        transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }],
                      }}>+</Animated.Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </>
          )}

          {/* ── Modals ── */}
          <ActionModal
            visible={!!actionTarget}
            itemLabel={actionTarget?.label ?? ''}
            onEdit={handleEdit}
            onMove={handleMove}
            onDuplicate={handleDuplicate}
            onMemo={handleMemo}
            onDelete={handleDelete}
            onCancel={() => setActionTarget(null)}
          />
          <MemoModal
            visible={memoModal.visible}
            label={memoModal.label}
            memo={memoModal.memo}
            onSave={handleSaveMemo}
            onCancel={() => setMemoModal(m => ({ ...m, visible: false }))}
          />
          <CategoryModal
            visible={catModal.visible}
            mode={catModal.mode}
            levelName={LEVEL_NAMES[catModal.targetLevel]}
            label={catModal.label}
            icon={catModal.icon}
            photoUri={catModal.photoUri}
            recentIcons={recentIcons}
            onChangeLabel={v => setCatModal(m => ({ ...m, label: v }))}
            onChangeIcon={v => setCatModal(m => ({ ...m, icon: v, photoUri: null }))}
            onChangePhoto={v => setCatModal(m => ({ ...m, photoUri: v }))}
            onSave={handleSaveCategory}
            onCancel={() => setCatModal(m => ({ ...m, visible: false }))}
          />
          <ItemModal
            visible={itemModal.visible}
            mode={itemModal.mode}
            label={itemModal.label}
            icon={itemModal.icon}
            qty={itemModal.qty}
            photoUri={itemModal.photoUri}
            recentIcons={recentIcons}
            onChangeLabel={v => setItemModal(m => ({ ...m, label: v }))}
            onChangeIcon={v => setItemModal(m => ({ ...m, icon: v, photoUri: null }))}
            onChangePhoto={v => setItemModal(m => ({ ...m, photoUri: v }))}
            onChangeQty={v => setItemModal(m => ({ ...m, qty: v }))}
            onSave={handleSaveItem}
            onCancel={() => setItemModal(m => ({ ...m, visible: false }))}
          />
          <SearchModal
            visible={searchVisible}
            query={searchQuery}
            results={searchResults}
            onChangeQuery={setSearchQuery}
            onCancel={() => setSearchVisible(false)}
            onItemPress={(item) => {
              setSearchVisible(false);
              if (item.pathIds) setPath(item.pathIds);
            }}
          />
          <MoveModal
            visible={moveModal.visible}
            targets={moveModal.targets ?? []}
            onSelect={(toPath) => {
              const item = moveModal.item;
              setMoveModal({ visible: false, targets: [] });
              // SpaceTree 모델을 거쳐 이동 — 타입 서열 / 순환 / MAX_SPACE overflow 검증 수행
              setHierarchy(prev => {
                const tree = hierarchyToSpaceTree(prev);
                const newParentId = toPath.length === 0 ? null : toPath[toPath.length - 1];
                try {
                  tree.moveObject(String(item.id), newParentId === null ? null : String(newParentId));
                } catch (e) {
                  Alert.alert('이동 불가', `${item.label}은(는) 하위 레벨로 이동할 수 없습니다.`);
                  return prev;
                }
                return spaceTreeToHierarchy(tree);
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }}
            onCancel={() => setMoveModal({ visible: false, targets: [] })}
          />

          <QtyInputModal
            visible={qtyModalForCard.visible}
            currentQty={qtyModalForCard.currentQty}
            label={qtyModalForCard.label}
            onConfirm={(newQty) => {
              setHierarchy(prev => updateNodeQty(prev, qtyModalForCard.nodeId, newQty));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              setQtyModalForCard(m => ({ ...m, visible: false }));
            }}
            onCancel={() => setQtyModalForCard(m => ({ ...m, visible: false }))}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
