import { StyleSheet, Platform } from 'react-native';
import { C } from './constants';

export default StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.navBg, paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.outlineVariant + '40',
  },
  headerTop: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 },
  headerLeft: { flexDirection:'row', alignItems:'center', gap:8 },
  headerTitle: { fontSize:19, fontWeight:'600', color:C.primary, marginLeft:6 },
  iconBtn: { width:36, height:36, alignItems:'center', justifyContent:'center', borderRadius:8 },
  breadcrumb: { flexDirection:'row', alignItems:'center', minHeight:32 },
  crumbRow: { flexDirection:'row', alignItems:'center' },
  crumbText: { fontSize:16, fontWeight:'500', color:C.onSurfaceVariant, paddingHorizontal:6 },
  crumbActive: { fontWeight:'700', color:C.primary },

  // ── Body ────────────────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal:16, paddingTop:20, paddingBottom:96, gap:28 },
  section: { gap:12 },
  sectionHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', minHeight:40 },
  sectionTitleRow: { flexDirection:'row', alignItems:'center', gap:8, flexShrink:1 },
  sectionTitle: { fontSize:17, fontWeight:'600', color:C.onSurface, flexShrink:1, lineHeight:22 },
  levelPill: { backgroundColor:C.primaryContainer, borderRadius:20, paddingHorizontal:8, paddingVertical:2 },
  levelPillText: { fontSize:13, fontWeight:'700', color:C.primary },
  addBtn: {
    flexDirection:'row', alignItems:'center', gap:2,
    paddingHorizontal:8, paddingVertical:4, borderRadius:8,
    backgroundColor: C.primaryContainer + '50',
  },
  addBtnText: { fontSize:13, fontWeight:'500', color:C.primary },
  countBadge: { backgroundColor:C.error, borderRadius:20, paddingHorizontal:6, paddingVertical:1 },
  countText: { fontSize:12, fontWeight:'700', color:C.onError },
  viewAll: { fontSize:13, fontWeight:'500', color:C.onSurfaceVariant },

  // ── Category Card (levels 0-2) ──────────────────────────────────────────────
  spaceGrid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  spaceCard: {
    width:'30.5%', aspectRatio:4/5, backgroundColor:C.surfaceLowest, borderRadius:14,
    alignItems:'center', justifyContent:'center', gap:12, paddingVertical:8,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:1,
  },
  spaceIconBg: { width:72, height:72, borderRadius:36, backgroundColor:C.primaryContainer, alignItems:'center', justifyContent:'center' },
  spaceLabel: { fontSize:14, fontWeight:'500', color:C.onSurface, textAlign:'center', paddingHorizontal:4 },

  // ── Item Card (level 3) ─────────────────────────────────────────────────────
  itemCard: {
    width:'30.5%', aspectRatio:4/5, backgroundColor:C.surfaceLowest, borderRadius:14,
    alignItems:'center', justifyContent:'center', gap:6, paddingVertical:8, paddingHorizontal:4,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:1,
  },
  itemIconBg: { width:64, height:64, borderRadius:32, backgroundColor:C.primaryContainer, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  itemCardLabel: { fontSize:13, fontWeight:'600', color:C.onSurface, textAlign:'center' },
  itemQtyRow: { flexDirection:'row', alignItems:'center', gap:3 },
  itemQtyBtn: { padding:2 },
  itemQtyBadge: { backgroundColor:C.primaryContainer, borderRadius:20, paddingHorizontal:6, paddingVertical:2 },
  itemQtyText: { fontSize:13, fontWeight:'700', color:C.primary },

  // ── Empty State ─────────────────────────────────────────────────────────────
  emptyState: { alignItems:'center', paddingVertical:40, gap:8 },
  emptyText: { fontSize:17, fontWeight:'600', color:C.onSurfaceVariant },
  emptySub: { fontSize:14, color:C.outlineVariant },

  // ── Task Items ──────────────────────────────────────────────────────────────
  taskList: { gap:8 },
  taskItem: {
    flexDirection:'row', alignItems:'center', gap:14,
    backgroundColor:C.surfaceLowest, borderRadius:14, padding:14,
    shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:4, elevation:1,
  },
  taskIconWrapper: { position:'relative' },
  taskIconBg: { width:48, height:48, borderRadius:10, backgroundColor:C.surfaceHigh, alignItems:'center', justifyContent:'center' },
  alertBadge: {
    position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:9,
    backgroundColor:C.error, borderWidth:2, borderColor:'#fff', alignItems:'center', justifyContent:'center',
  },
  alertText: { color:'#fff', fontSize:11, fontWeight:'700' },
  taskInfo: { flex:1, gap:2 },
  taskTitle: { fontSize:16, fontWeight:'600', color:C.onSurface },
  taskSub: { fontSize:14, color:C.onSurfaceVariant },

  // ── Bottom Nav ──────────────────────────────────────────────────────────────
  bottomNav: {
    flexDirection:'row', justifyContent:'space-around', alignItems:'center',
    backgroundColor:C.navBg, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:C.outlineVariant+'40',
    paddingBottom:Platform.OS==='ios'?20:8, paddingTop:8,
  },
  navTab: { alignItems:'center', justifyContent:'center', paddingHorizontal:14, paddingVertical:4, borderRadius:10, gap:2 },
  navTabActive: { backgroundColor:C.primaryContainer },
  navLabel: { fontSize:13, fontWeight:'500', color:C.onSurfaceVariant },
  navLabelActive: { color:C.primary },

  // ── Modals (shared) ─────────────────────────────────────────────────────────
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' },
  modalSheet: { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40, maxHeight:'85%' },
  modalTitle: { fontSize:20, fontWeight:'700', color:C.onSurface, marginBottom:16 },
  modalIconPreview: {
    width:80, height:80, borderRadius:40,
    backgroundColor:C.primaryContainer, alignItems:'center', justifyContent:'center',
    overflow: 'hidden',
  },
  photoPickerRow: { flexDirection:'row', alignItems:'center', gap:16, alignSelf:'center', marginBottom:16 },
  photoBtn: {
    alignItems:'center', gap:4, paddingHorizontal:14, paddingVertical:10, borderRadius:14,
    borderWidth:1.5, borderColor:C.outlineVariant, backgroundColor:C.surfaceHigh,
  },
  photoBtnText: { fontSize:12, fontWeight:'600', color:C.onSurfaceVariant },
  modalInput: {
    borderWidth:1.5, borderColor:C.outlineVariant, borderRadius:12,
    paddingHorizontal:14, height: 48, fontSize:17, color:C.onSurface, marginBottom:16,
    justifyContent: 'center',
  },
  iconGrid: { marginBottom:16 },
  // 5-column categorized icon picker
  iconPickerScroll: { maxHeight:300, marginBottom:16 },
  iconSection: { marginBottom:12 },
  iconSectionHeader: {
    fontSize:11, fontWeight:'700', color:C.onSurfaceVariant,
    marginBottom:6, textTransform:'uppercase', letterSpacing:0.5,
  },
  iconGrid5: { flexDirection:'row', flexWrap:'wrap' },
  iconCell: { width:'20%', aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:10, borderWidth:2, borderColor:'transparent' },
  iconCellActive: { backgroundColor:C.primaryContainer, borderColor:C.primary },
  iconOption: { flex:1, aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:10, margin:3 },
  iconOptionActive: { backgroundColor:C.primaryContainer },
  modalActions: { flexDirection:'row', gap:10, marginTop:8 },
  cancelBtn: { flex:1, paddingVertical:14, borderRadius:14, alignItems:'center', borderWidth:1.5, borderColor:C.outlineVariant },
  cancelBtnText: { fontSize:17, fontWeight:'600', color:C.onSurfaceVariant },
  saveBtn: { flex:1, paddingVertical:14, borderRadius:14, alignItems:'center', backgroundColor:C.primary },
  saveBtnText: { fontSize:17, fontWeight:'600', color:'#fff' },
  qtyRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  qtyLabel: { fontSize:17, fontWeight:'500', color:C.onSurface },
  qtyStepper: { flexDirection:'row', alignItems:'center', gap:16 },
  qtyValue: { fontSize:24, fontWeight:'700', color:C.onSurface, minWidth:36, textAlign:'center' },

  // ── Action Sheet ────────────────────────────────────────────────────────────
  actionSheet: { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, paddingTop:12, paddingBottom:40 },
  actionHandle: { width:40, height:4, borderRadius:2, backgroundColor:C.outlineVariant, alignSelf:'center', marginBottom:16 },
  actionLabel: { fontSize:15, fontWeight:'600', color:C.onSurfaceVariant, paddingHorizontal:24, paddingBottom:8 },
  actionRow: { flexDirection:'row', alignItems:'center', gap:16, paddingHorizontal:24, paddingVertical:16 },
  actionRowText: { fontSize:18, fontWeight:'500', color:C.onSurface },
  actionRowDelete: { fontSize:18, fontWeight:'500', color:C.error },
  actionDivider: { height:StyleSheet.hairlineWidth, backgroundColor:C.outlineVariant+'60', marginHorizontal:24 },

  // ── Search Popup ────────────────────────────────────────────────────────────
  searchOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.35)' },
  searchPopup: {
    marginHorizontal:16, marginTop:115, backgroundColor:'#fff', borderRadius:18, maxHeight:'60%',
    shadowColor:'#000', shadowOffset:{width:0,height:6}, shadowOpacity:0.18, shadowRadius:16, elevation:10, overflow:'hidden',
  },
  searchHeader: {
    flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:12,
    borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:C.outlineVariant+'40',
  },
  searchInput2: { flex:1, fontSize:18, color:C.onSurface },
  searchCancelBtn: { paddingHorizontal:4 },
  searchCancelText: { fontSize:17, color:C.primary, fontWeight:'500' },
  searchResultItem: {
    flexDirection:'row', alignItems:'center', gap:14, paddingHorizontal:16, paddingVertical:12,
    borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:C.outlineVariant+'30',
  },
  searchResultIcon: { width:40, height:40, borderRadius:20, backgroundColor:C.primaryContainer, alignItems:'center', justifyContent:'center' },
  searchResultLabel: { fontSize:16, fontWeight:'600', color:C.onSurface },
  searchResultPath: { fontSize:13, color:C.onSurfaceVariant, marginTop:2 },
  searchEmpty: { alignItems:'center', paddingVertical:32, gap:8 },
  searchEmptyText: { fontSize:16, color:C.onSurfaceVariant },
});
