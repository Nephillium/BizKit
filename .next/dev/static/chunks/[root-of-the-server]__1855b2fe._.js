(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/hooks/useAuth.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useAuth() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        user: null,
        isLoading: true,
        isAuthenticated: false
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuth.useEffect": ()=>{
            async function fetchUser() {
                try {
                    const response = await fetch('/api/auth/user', {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const user = await response.json();
                        setState({
                            user,
                            isLoading: false,
                            isAuthenticated: true
                        });
                    } else {
                        setState({
                            user: null,
                            isLoading: false,
                            isAuthenticated: false
                        });
                    }
                } catch (error) {
                    setState({
                        user: null,
                        isLoading: false,
                        isAuthenticated: false
                    });
                }
            }
            fetchUser();
        }
    }["useAuth.useEffect"], []);
    return state;
}
_s(useAuth, "9oIFqv5+Avr+VGkg95tnQiipoFk=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pages/index.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jspdf/dist/jspdf.es.min.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/docx/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useAuth.ts [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
;
const initialFormData = {
    cold_email: {
        target: '',
        service: '',
        tone: '',
        language: 'English'
    },
    proposal: {
        clientType: '',
        projectScope: '',
        deliverables: '',
        budgetRange: '',
        language: 'English'
    },
    contract: {
        clientName: '',
        providerName: '',
        serviceDescription: '',
        paymentTerms: '',
        jurisdiction: '',
        language: 'English'
    },
    social_pack: {
        businessType: '',
        niche: '',
        tone: '',
        platform: '',
        language: 'English'
    }
};
const tabLabels = {
    cold_email: 'Cold Email',
    proposal: 'Proposal',
    contract: 'Contract',
    social_pack: 'Social Pack'
};
const LANGUAGES = [
    'English',
    'Spanish',
    'French',
    'German',
    'Portuguese',
    'Italian',
    'Dutch',
    'Swedish',
    'Danish',
    'Norwegian',
    'Finnish',
    'Polish',
    'Turkish',
    'Arabic',
    'Hebrew',
    'Russian',
    'Ukrainian',
    'Hindi',
    'Bengali',
    'Indonesian',
    'Malay',
    'Vietnamese',
    'Thai',
    'Chinese (Simplified)',
    'Chinese (Traditional)',
    'Japanese',
    'Korean'
];
function LanguagePicker({ value, onChange, testId }) {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isCustomMode, setIsCustomMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [customValue, setCustomValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const dropdownRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const filteredLanguages = LANGUAGES.filter((lang)=>lang.toLowerCase().includes(searchQuery.toLowerCase()));
    const isCustomLanguage = value && !LANGUAGES.includes(value);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LanguagePicker.useEffect": ()=>{
            function handleClickOutside(event) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                    setSearchQuery('');
                    setIsCustomMode(false);
                }
            }
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "LanguagePicker.useEffect": ()=>document.removeEventListener('mousedown', handleClickOutside)
            })["LanguagePicker.useEffect"];
        }
    }["LanguagePicker.useEffect"], []);
    const handleSelectLanguage = (lang)=>{
        onChange(lang);
        setIsOpen(false);
        setSearchQuery('');
        setIsCustomMode(false);
    };
    const handleCustomSubmit = ()=>{
        if (customValue.trim()) {
            onChange(customValue.trim());
            setIsOpen(false);
            setSearchQuery('');
            setIsCustomMode(false);
            setCustomValue('');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: dropdownRef,
        style: {
            position: 'relative'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: ()=>setIsOpen(!isOpen),
                style: {
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '1rem',
                    backgroundColor: 'rgb(255, 255, 255)',
                    border: '1px solid rgb(226, 232, 240)',
                    borderRadius: '6px',
                    color: value ? 'rgb(15, 23, 42)' : 'rgb(148, 163, 184)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.2s ease'
                },
                "data-testid": testId,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: value || 'Select language'
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        style: {
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            color: 'rgb(100, 116, 139)'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                            points: "6 9 12 15 18 9"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 206,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgb(255, 255, 255)',
                    border: '1px solid rgb(226, 232, 240)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 50,
                    maxHeight: '300px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                },
                "data-testid": `${testId}-dropdown`,
                children: !isCustomMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                padding: '8px',
                                borderBottom: '1px solid rgb(241, 245, 249)'
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Search languages...",
                                value: searchQuery,
                                onChange: (e)=>setSearchQuery(e.target.value),
                                autoFocus: true,
                                style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'rgb(248, 250, 252)',
                                    border: '1px solid rgb(226, 232, 240)',
                                    borderRadius: '6px',
                                    color: 'rgb(15, 23, 42)'
                                },
                                "data-testid": `${testId}-search`
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 232,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 231,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                overflowY: 'auto',
                                maxHeight: '200px'
                            },
                            children: [
                                filteredLanguages.map((lang)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>handleSelectLanguage(lang),
                                        style: {
                                            width: '100%',
                                            padding: '10px 16px',
                                            fontSize: '0.875rem',
                                            textAlign: 'left',
                                            backgroundColor: value === lang ? 'rgb(238, 242, 255)' : 'transparent',
                                            color: value === lang ? 'rgb(99, 102, 241)' : 'rgb(51, 65, 85)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'background-color 0.15s ease'
                                        },
                                        onMouseEnter: (e)=>{
                                            if (value !== lang) {
                                                e.currentTarget.style.backgroundColor = 'rgb(248, 250, 252)';
                                            }
                                        },
                                        onMouseLeave: (e)=>{
                                            if (value !== lang) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        },
                                        "data-testid": `${testId}-option-${lang.toLowerCase().replace(/[^a-z]/g, '-')}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: lang
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 283,
                                                columnNumber: 21
                                            }, this),
                                            value === lang && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "16",
                                                height: "16",
                                                viewBox: "0 0 24 24",
                                                fill: "none",
                                                stroke: "currentColor",
                                                strokeWidth: "2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "20 6 9 17 4 12"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 25
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 285,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, lang, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 253,
                                        columnNumber: 19
                                    }, this)),
                                filteredLanguages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: '16px',
                                        textAlign: 'center',
                                        color: 'rgb(100, 116, 139)',
                                        fontSize: '0.875rem'
                                    },
                                    children: "No languages found"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 292,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 251,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                padding: '8px',
                                borderTop: '1px solid rgb(241, 245, 249)'
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>{
                                    setIsCustomMode(true);
                                    setCustomValue(isCustomLanguage ? value : '');
                                },
                                style: {
                                    width: '100%',
                                    padding: '10px 16px',
                                    fontSize: '0.875rem',
                                    textAlign: 'left',
                                    backgroundColor: 'transparent',
                                    color: 'rgb(99, 102, 241)',
                                    border: '1px dashed rgb(199, 210, 254)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                },
                                "data-testid": `${testId}-custom-option`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "14",
                                        height: "14",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "12",
                                                y1: "5",
                                                x2: "12",
                                                y2: "19"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 322,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                x1: "5",
                                                y1: "12",
                                                x2: "19",
                                                y2: "12"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 323,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 321,
                                        columnNumber: 19
                                    }, this),
                                    "Custom language..."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 299,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 298,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        padding: '12px'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            style: {
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: 'rgb(100, 116, 139)',
                                marginBottom: '8px'
                            },
                            children: "Enter custom language"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 331,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                gap: '8px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: customValue,
                                    onChange: (e)=>setCustomValue(e.target.value),
                                    placeholder: "e.g. Swahili, Tagalog...",
                                    autoFocus: true,
                                    onKeyDown: (e)=>{
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleCustomSubmit();
                                        }
                                        if (e.key === 'Escape') {
                                            setIsCustomMode(false);
                                        }
                                    },
                                    style: {
                                        flex: 1,
                                        padding: '8px 12px',
                                        fontSize: '0.875rem',
                                        backgroundColor: 'rgb(248, 250, 252)',
                                        border: '1px solid rgb(226, 232, 240)',
                                        borderRadius: '6px',
                                        color: 'rgb(15, 23, 42)'
                                    },
                                    "data-testid": `${testId}-custom-input`
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 335,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleCustomSubmit,
                                    disabled: !customValue.trim(),
                                    style: {
                                        padding: '8px 16px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        backgroundColor: customValue.trim() ? 'rgb(99, 102, 241)' : 'rgb(226, 232, 240)',
                                        color: customValue.trim() ? 'rgb(255, 255, 255)' : 'rgb(148, 163, 184)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: customValue.trim() ? 'pointer' : 'not-allowed'
                                    },
                                    "data-testid": `${testId}-custom-submit`,
                                    children: "Add"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 361,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 334,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setIsCustomMode(false),
                            style: {
                                marginTop: '8px',
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                color: 'rgb(100, 116, 139)',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer'
                            },
                            "data-testid": `${testId}-custom-back`,
                            children: "Back to list"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 380,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/index.tsx",
                    lineNumber: 330,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 211,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/index.tsx",
        lineNumber: 169,
        columnNumber: 5
    }, this);
}
_s(LanguagePicker, "XhjDjkbmU2T8Zn+j3tUE0v8IxpU=");
_c = LanguagePicker;
function Home() {
    _s1();
    const { user, isLoading: authLoading, isAuthenticated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('cold_email');
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(initialFormData);
    const [output, setOutput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [copyState, setCopyState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [exportState, setExportState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [showExportMenu, setShowExportMenu] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const exportMenuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [generations, setGenerations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [showHistory, setShowHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [historyLoading, setHistoryLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showSubscriptionPrompt, setShowSubscriptionPrompt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [usageInfo, setUsageInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [premiumOptions, setPremiumOptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        model: 'gpt-4o-mini',
        length: 'standard',
        creativity: 50,
        customInstructions: ''
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Home.useEffect": ()=>{
            if (isAuthenticated) {
                fetchGenerations();
            }
        }
    }["Home.useEffect"], [
        isAuthenticated
    ]);
    const fetchGenerations = async ()=>{
        try {
            setHistoryLoading(true);
            const response = await fetch('/api/generations', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setGenerations(data);
            }
        } catch (err) {
            console.error('Failed to fetch generations:', err);
        } finally{
            setHistoryLoading(false);
        }
    };
    const saveGeneration = async ()=>{
        if (!isAuthenticated || !output) return;
        try {
            const response = await fetch('/api/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    toolType: activeTab,
                    inputs: formData[activeTab],
                    output
                })
            });
            if (response.ok) {
                fetchGenerations();
            }
        } catch (err) {
            console.error('Failed to save generation:', err);
        }
    };
    const deleteGeneration = async (id)=>{
        try {
            const response = await fetch(`/api/generations/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                setGenerations(generations.filter((g)=>g.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete generation:', err);
        }
    };
    const loadGeneration = (generation)=>{
        setActiveTab(generation.toolType);
        setFormData((prev)=>({
                ...prev,
                [generation.toolType]: generation.inputs
            }));
        setOutput(generation.output);
        setShowHistory(false);
    };
    const handleExportText = ()=>{
        if (!output) return;
        const blob = new Blob([
            output
        ], {
            type: 'text/plain;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bizkit-${activeTab}-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };
    const handleExportPDF = ()=>{
        if (!output) return;
        setExportState('exporting');
        try {
            const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jspdf$2f$dist$2f$jspdf$2e$es$2e$min$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsPDF"]();
            const title = tabLabels[activeTab];
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - margin * 2;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(`BizKit AI - ${title}`, margin, margin);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, margin + 8);
            doc.setFontSize(11);
            doc.setTextColor(0);
            const lines = doc.splitTextToSize(output, maxWidth);
            doc.text(lines, margin, margin + 20);
            doc.save(`bizkit-${activeTab}-${Date.now()}.pdf`);
        } catch (err) {
            console.error('PDF export error:', err);
        } finally{
            setExportState('idle');
            setShowExportMenu(false);
        }
    };
    const handleExportWord = async ()=>{
        if (!output) return;
        setExportState('exporting');
        try {
            const title = tabLabels[activeTab];
            const paragraphs = output.split('\n').filter((line)=>line.trim()).map((line)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Paragraph"]({
                    children: [
                        new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["TextRun"](line)
                    ],
                    spacing: {
                        after: 200
                    }
                }));
            const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Document"]({
                sections: [
                    {
                        properties: {},
                        children: [
                            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Paragraph"]({
                                children: [
                                    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["TextRun"]({
                                        text: `BizKit AI - ${title}`,
                                        bold: true,
                                        size: 32
                                    })
                                ],
                                spacing: {
                                    after: 200
                                }
                            }),
                            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Paragraph"]({
                                children: [
                                    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["TextRun"]({
                                        text: `Generated on ${new Date().toLocaleDateString()}`,
                                        color: '666666',
                                        size: 20
                                    })
                                ],
                                spacing: {
                                    after: 400
                                }
                            }),
                            ...paragraphs
                        ]
                    }
                ]
            });
            const blob = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Packer"].toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bizkit-${activeTab}-${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Word export error:', err);
        } finally{
            setExportState('idle');
            setShowExportMenu(false);
        }
    };
    const handleCopyToClipboard = async ()=>{
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopyState('copied');
            setTimeout(()=>setCopyState('idle'), 2000);
        } catch (err) {
            setCopyState('error');
            setTimeout(()=>setCopyState('idle'), 2000);
        }
    };
    const handleRegenerate = async ()=>{
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        const previousOutput = output;
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    tool: activeTab,
                    inputs: formData[activeTab],
                    premiumOptions: showAdvancedOptions ? premiumOptions : undefined
                })
            });
            const data = await response.json();
            if (data.ok) {
                setOutput(data.output);
                if (data.usageCount !== undefined && data.usageLimit !== undefined) {
                    setUsageInfo({
                        count: data.usageCount,
                        limit: data.usageLimit
                    });
                }
            } else {
                setOutput(previousOutput);
                if (data.error === 'usage_limit_exceeded') {
                    setUsageInfo({
                        count: data.usageCount,
                        limit: data.usageLimit
                    });
                    setShowSubscriptionPrompt(true);
                    setError('');
                } else {
                    setError(data.error === 'missing_openai_key' ? 'OpenAI API key is not configured. Please add your API key.' : data.error === 'openai_error' ? 'An error occurred while generating content. Please try again.' : data.error || 'An unexpected error occurred.');
                }
            }
        } catch (err) {
            setOutput(previousOutput);
            setError('Network error. Please check your connection and try again.');
        } finally{
            setIsLoading(false);
        }
    };
    const updateFormField = (tool, field, value)=>{
        setFormData((prev)=>({
                ...prev,
                [tool]: {
                    ...prev[tool],
                    [field]: value
                }
            }));
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setOutput('');
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    tool: activeTab,
                    inputs: formData[activeTab],
                    premiumOptions: showAdvancedOptions ? premiumOptions : undefined
                })
            });
            const data = await response.json();
            if (data.ok) {
                setOutput(data.output);
                if (data.usageCount !== undefined && data.usageLimit !== undefined) {
                    setUsageInfo({
                        count: data.usageCount,
                        limit: data.usageLimit
                    });
                }
            } else {
                if (data.error === 'usage_limit_exceeded') {
                    setUsageInfo({
                        count: data.usageCount,
                        limit: data.usageLimit
                    });
                    setShowSubscriptionPrompt(true);
                    setError('');
                } else {
                    setError(data.error === 'missing_openai_key' ? 'OpenAI API key is not configured. Please add your API key.' : data.error === 'openai_error' ? 'An error occurred while generating content. Please try again.' : data.error || 'An unexpected error occurred.');
                }
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally{
            setIsLoading(false);
        }
    };
    const inputStyles = {
        base: `
      w-full px-4 py-3 
      bg-white dark:bg-slate-800 
      border border-slate-200 dark:border-slate-700 
      rounded-md 
      text-slate-900 dark:text-slate-100 
      placeholder:text-slate-400 dark:placeholder:text-slate-500
      focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
      transition-all duration-200
    `
    };
    const labelStyles = `
    block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2
  `;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                        children: "BizKit AI - Client-Winning Content in Seconds"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 754,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 755,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("link", {
                        rel: "icon",
                        href: "/favicon.ico"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 756,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 753,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    minHeight: '100vh',
                    backgroundColor: 'rgb(250, 250, 250)',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 24px',
                            backgroundColor: 'rgb(255, 255, 255)',
                            borderBottom: '1px solid rgb(226, 232, 240)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 600,
                                    fontSize: '1.125rem',
                                    color: 'rgb(15, 23, 42)'
                                },
                                children: "BizKit AI"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 777,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                },
                                children: authLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '0.875rem',
                                        color: 'rgb(148, 163, 184)'
                                    },
                                    children: "Loading..."
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 782,
                                    columnNumber: 15
                                }, this) : isAuthenticated && user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setShowHistory(!showHistory),
                                            style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 14px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 500,
                                                color: 'rgb(71, 85, 105)',
                                                backgroundColor: 'rgb(241, 245, 249)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            },
                                            "data-testid": "button-history",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "14",
                                                    height: "14",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                            cx: "12",
                                                            cy: "12",
                                                            r: "10"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 804,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                            points: "12 6 12 12 16 14"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 805,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 803,
                                                    columnNumber: 19
                                                }, this),
                                                "History"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 785,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            },
                                            children: [
                                                user.profileImageUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: user.profileImageUrl,
                                                    alt: "Profile",
                                                    style: {
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover'
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 811,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: '0.875rem',
                                                        color: 'rgb(51, 65, 85)'
                                                    },
                                                    "data-testid": "text-username",
                                                    children: user.firstName || user.email || 'User'
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 822,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 809,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "/api/logout",
                                            style: {
                                                padding: '8px 14px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 500,
                                                color: 'rgb(239, 68, 68)',
                                                backgroundColor: 'rgb(254, 242, 242)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                cursor: 'pointer'
                                            },
                                            "data-testid": "button-logout",
                                            children: "Log out"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 826,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "/api/login",
                                    style: {
                                        padding: '8px 16px',
                                        fontSize: '0.8125rem',
                                        fontWeight: 500,
                                        color: 'rgb(255, 255, 255)',
                                        backgroundColor: 'rgb(99, 102, 241)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        cursor: 'pointer'
                                    },
                                    "data-testid": "button-login",
                                    children: "Log in"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 845,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 780,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 767,
                        columnNumber: 9
                    }, this),
                    showHistory && isAuthenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: '400px',
                            maxWidth: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgb(255, 255, 255)',
                            borderLeft: '1px solid rgb(226, 232, 240)',
                            boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        "data-testid": "panel-history",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid rgb(226, 232, 240)'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        style: {
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'rgb(15, 23, 42)',
                                            margin: 0
                                        },
                                        children: "Generation History"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 894,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setShowHistory(false),
                                        style: {
                                            padding: '6px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'rgb(148, 163, 184)'
                                        },
                                        "data-testid": "button-close-history",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "20",
                                            height: "20",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "18",
                                                    y1: "6",
                                                    x2: "6",
                                                    y2: "18"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 910,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                    x1: "6",
                                                    y1: "6",
                                                    x2: "18",
                                                    y2: "18"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 911,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 909,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 897,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 885,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px'
                                },
                                children: historyLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        textAlign: 'center',
                                        color: 'rgb(148, 163, 184)',
                                        padding: '40px 0'
                                    },
                                    children: "Loading..."
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 923,
                                    columnNumber: 17
                                }, this) : generations.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        textAlign: 'center',
                                        color: 'rgb(148, 163, 184)',
                                        padding: '40px 0'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            width: "40",
                                            height: "40",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "1.5",
                                            style: {
                                                margin: '0 auto 12px'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                    cx: "12",
                                                    cy: "12",
                                                    r: "10"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 929,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                    points: "12 6 12 12 16 14"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 930,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 928,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: '0.875rem'
                                            },
                                            children: "No saved generations yet"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 932,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: '0.75rem',
                                                marginTop: '4px'
                                            },
                                            children: "Generate content and save it to see your history"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 933,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 927,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    },
                                    children: generations.map((gen)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: '14px',
                                                backgroundColor: 'rgb(248, 250, 252)',
                                                borderRadius: '6px',
                                                border: '1px solid rgb(226, 232, 240)'
                                            },
                                            "data-testid": `history-item-${gen.id}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        marginBottom: '8px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                display: 'inline-block',
                                                                padding: '4px 8px',
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 500,
                                                                backgroundColor: 'rgb(238, 242, 255)',
                                                                color: 'rgb(99, 102, 241)',
                                                                borderRadius: '4px',
                                                                textTransform: 'uppercase'
                                                            },
                                                            children: tabLabels[gen.toolType] || gen.toolType
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 949,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                fontSize: '0.6875rem',
                                                                color: 'rgb(148, 163, 184)'
                                                            },
                                                            children: new Date(gen.createdAt).toLocaleDateString()
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 963,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 948,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        fontSize: '0.8125rem',
                                                        color: 'rgb(51, 65, 85)',
                                                        lineHeight: 1.5,
                                                        marginBottom: '12px',
                                                        overflow: 'hidden',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical'
                                                    },
                                                    children: [
                                                        gen.output.substring(0, 150),
                                                        "..."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 967,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        gap: '8px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>loadGeneration(gen),
                                                            style: {
                                                                flex: 1,
                                                                padding: '6px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                color: 'rgb(99, 102, 241)',
                                                                backgroundColor: 'rgb(255, 255, 255)',
                                                                border: '1px solid rgb(199, 210, 254)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            },
                                                            "data-testid": `button-load-${gen.id}`,
                                                            children: "Load"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 982,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>deleteGeneration(gen.id),
                                                            style: {
                                                                padding: '6px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                color: 'rgb(239, 68, 68)',
                                                                backgroundColor: 'rgb(255, 255, 255)',
                                                                border: '1px solid rgb(254, 202, 202)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            },
                                                            "data-testid": `button-delete-${gen.id}`,
                                                            children: "Delete"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 1000,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 981,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, gen.id, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 938,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 936,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 915,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 868,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        style: {
                            padding: '64px 16px',
                            textAlign: 'center',
                            borderBottom: '1px solid rgb(226, 232, 240)',
                            background: 'linear-gradient(180deg, rgb(255,255,255) 0%, rgb(248,250,252) 100%)'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                maxWidth: '768px',
                                margin: '0 auto'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    style: {
                                        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                                        fontWeight: 700,
                                        color: 'rgb(15, 23, 42)',
                                        letterSpacing: '-0.02em',
                                        marginBottom: '16px',
                                        lineHeight: 1.2
                                    },
                                    "data-testid": "text-hero-title",
                                    children: "BizKit AI – Client-Winning Content in Seconds"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 1036,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: '1.125rem',
                                        color: 'rgb(71, 85, 105)',
                                        lineHeight: 1.6,
                                        marginBottom: '16px'
                                    },
                                    "data-testid": "text-hero-subtitle",
                                    children: "Cold emails, proposals, contracts and social media posts for freelancers & agencies."
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 1049,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    style: {
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'rgb(99, 102, 241)',
                                        backgroundColor: 'rgb(238, 242, 255)',
                                        borderRadius: '9999px',
                                        border: '1px solid rgb(199, 210, 254)'
                                    },
                                    "data-testid": "badge-beta",
                                    children: "Free beta – Pro plans coming soon"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 1060,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 1035,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 1027,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        style: {
                            maxWidth: '896px',
                            margin: '0 auto',
                            padding: '32px 16px'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginBottom: '32px'
                                },
                                "data-testid": "tabs-container",
                                children: Object.keys(tabLabels).map((tool)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setActiveTab(tool);
                                            setOutput('');
                                            setError('');
                                        },
                                        style: {
                                            padding: '10px 20px',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: activeTab === tool ? 'rgb(99, 102, 241)' : 'rgb(241, 245, 249)',
                                            color: activeTab === tool ? 'rgb(255, 255, 255)' : 'rgb(71, 85, 105)',
                                            boxShadow: activeTab === tool ? '0 1px 3px rgba(99, 102, 241, 0.3)' : 'none'
                                        },
                                        "data-testid": `tab-${tool}`,
                                        children: tabLabels[tool]
                                    }, tool, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1097,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 1087,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubmit,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            backgroundColor: 'rgb(255, 255, 255)',
                                            borderRadius: '8px',
                                            border: '1px solid rgb(226, 232, 240)',
                                            padding: '24px',
                                            marginBottom: '24px'
                                        },
                                        children: [
                                            activeTab === 'cold_email' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "target",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Target Audience"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1147,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "target",
                                                                type: "text",
                                                                placeholder: "e.g. clinic owners in Istanbul",
                                                                value: formData.cold_email.target,
                                                                onChange: (e)=>updateFormField('cold_email', 'target', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-target"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1159,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1146,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "service",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Service"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1180,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "service",
                                                                type: "text",
                                                                placeholder: "e.g. Google Ads management",
                                                                value: formData.cold_email.service,
                                                                onChange: (e)=>updateFormField('cold_email', 'service', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-service"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1192,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1179,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "tone",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Tone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1213,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "tone",
                                                                type: "text",
                                                                placeholder: "friendly, professional, casual",
                                                                value: formData.cold_email.tone,
                                                                onChange: (e)=>updateFormField('cold_email', 'tone', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-tone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1225,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1212,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1246,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguagePicker, {
                                                                value: formData.cold_email.language,
                                                                onChange: (value)=>updateFormField('cold_email', 'language', value),
                                                                testId: "select-language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1257,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1245,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1145,
                                                columnNumber: 17
                                            }, this),
                                            activeTab === 'proposal' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "clientType",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Client Type"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1270,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "clientType",
                                                                type: "text",
                                                                placeholder: "e-commerce brand, SaaS founder, etc.",
                                                                value: formData.proposal.clientType,
                                                                onChange: (e)=>updateFormField('proposal', 'clientType', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-clientType"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1282,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1269,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "projectScope",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Project Scope"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1303,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                id: "projectScope",
                                                                placeholder: "Describe the project scope...",
                                                                value: formData.proposal.projectScope,
                                                                onChange: (e)=>updateFormField('proposal', 'projectScope', e.target.value),
                                                                rows: 4,
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)',
                                                                    resize: 'vertical',
                                                                    minHeight: '120px'
                                                                },
                                                                "data-testid": "input-projectScope"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1315,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1302,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "deliverables",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Deliverables"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1338,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                id: "deliverables",
                                                                placeholder: "List the deliverables...",
                                                                value: formData.proposal.deliverables,
                                                                onChange: (e)=>updateFormField('proposal', 'deliverables', e.target.value),
                                                                rows: 4,
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)',
                                                                    resize: 'vertical',
                                                                    minHeight: '120px'
                                                                },
                                                                "data-testid": "input-deliverables"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1350,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1337,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "budgetRange",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Budget Range"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1373,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "budgetRange",
                                                                type: "text",
                                                                placeholder: "$2,000 - $5,000",
                                                                value: formData.proposal.budgetRange,
                                                                onChange: (e)=>updateFormField('proposal', 'budgetRange', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-budgetRange"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1385,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1372,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1406,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguagePicker, {
                                                                value: formData.proposal.language,
                                                                onChange: (value)=>updateFormField('proposal', 'language', value),
                                                                testId: "select-proposalLanguage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1417,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1405,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1268,
                                                columnNumber: 17
                                            }, this),
                                            activeTab === 'contract' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "clientName",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Client Name"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1430,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "clientName",
                                                                type: "text",
                                                                placeholder: "Client's full name or company name",
                                                                value: formData.contract.clientName,
                                                                onChange: (e)=>updateFormField('contract', 'clientName', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-clientName"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1442,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1429,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "providerName",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Provider Name"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1463,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "providerName",
                                                                type: "text",
                                                                placeholder: "Your name or company name",
                                                                value: formData.contract.providerName,
                                                                onChange: (e)=>updateFormField('contract', 'providerName', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-providerName"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1475,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1462,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "serviceDescription",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Service Description"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1496,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                id: "serviceDescription",
                                                                placeholder: "Describe the services to be provided...",
                                                                value: formData.contract.serviceDescription,
                                                                onChange: (e)=>updateFormField('contract', 'serviceDescription', e.target.value),
                                                                rows: 4,
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)',
                                                                    resize: 'vertical',
                                                                    minHeight: '120px'
                                                                },
                                                                "data-testid": "input-serviceDescription"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1508,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1495,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "paymentTerms",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Payment Terms"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1531,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "paymentTerms",
                                                                type: "text",
                                                                placeholder: "e.g. 50% upfront, 50% on delivery",
                                                                value: formData.contract.paymentTerms,
                                                                onChange: (e)=>updateFormField('contract', 'paymentTerms', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-paymentTerms"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1543,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1530,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "jurisdiction",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Jurisdiction"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1564,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "jurisdiction",
                                                                type: "text",
                                                                placeholder: "e.g. Turkey",
                                                                value: formData.contract.jurisdiction,
                                                                onChange: (e)=>updateFormField('contract', 'jurisdiction', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-jurisdiction"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1576,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1563,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1597,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguagePicker, {
                                                                value: formData.contract.language,
                                                                onChange: (value)=>updateFormField('contract', 'language', value),
                                                                testId: "select-contractLanguage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1608,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1596,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1428,
                                                columnNumber: 17
                                            }, this),
                                            activeTab === 'social_pack' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "businessType",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Business Type"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1621,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "businessType",
                                                                type: "text",
                                                                placeholder: "e.g. coffee shop, agency",
                                                                value: formData.social_pack.businessType,
                                                                onChange: (e)=>updateFormField('social_pack', 'businessType', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-businessType"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1633,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1620,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "niche",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Niche"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1654,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "niche",
                                                                type: "text",
                                                                placeholder: "Your specific niche or industry",
                                                                value: formData.social_pack.niche,
                                                                onChange: (e)=>updateFormField('social_pack', 'niche', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-niche"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1666,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1653,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "socialTone",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Tone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1687,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "socialTone",
                                                                type: "text",
                                                                placeholder: "friendly, playful, educational",
                                                                value: formData.social_pack.tone,
                                                                onChange: (e)=>updateFormField('social_pack', 'tone', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-socialTone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1699,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1686,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "platform",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Platform"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1720,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "platform",
                                                                type: "text",
                                                                placeholder: "Instagram, LinkedIn, X",
                                                                value: formData.social_pack.platform,
                                                                onChange: (e)=>updateFormField('social_pack', 'platform', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-platform"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1732,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1719,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1753,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguagePicker, {
                                                                value: formData.social_pack.language,
                                                                onChange: (value)=>updateFormField('social_pack', 'language', value),
                                                                testId: "select-socialLanguage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1764,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1752,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1619,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1134,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: '24px'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowAdvancedOptions(!showAdvancedOptions),
                                                style: {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '10px 16px',
                                                    width: '100%',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'rgb(71, 85, 105)',
                                                    backgroundColor: 'rgb(248, 250, 252)',
                                                    border: '1px solid rgb(226, 232, 240)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                },
                                                "data-testid": "button-toggle-advanced",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        width: "16",
                                                        height: "16",
                                                        viewBox: "0 0 24 24",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        style: {
                                                            transform: showAdvancedOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease'
                                                        },
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                            points: "6 9 12 15 18 9"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 1810,
                                                            columnNumber: 19
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1796,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                        width: "16",
                                                        height: "16",
                                                        viewBox: "0 0 24 24",
                                                        fill: "none",
                                                        stroke: "currentColor",
                                                        strokeWidth: "2",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                cx: "12",
                                                                cy: "12",
                                                                r: "3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1822,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1823,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1812,
                                                        columnNumber: 17
                                                    }, this),
                                                    "Advanced Options",
                                                    showAdvancedOptions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            marginLeft: 'auto',
                                                            fontSize: '0.75rem',
                                                            color: 'rgb(99, 102, 241)',
                                                            fontWeight: 400
                                                        },
                                                        children: "Customize AI behavior"
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1827,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1776,
                                                columnNumber: 15
                                            }, this),
                                            showAdvancedOptions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    marginTop: '12px',
                                                    padding: '20px',
                                                    backgroundColor: 'rgb(248, 250, 252)',
                                                    border: '1px solid rgb(226, 232, 240)',
                                                    borderRadius: '8px'
                                                },
                                                "data-testid": "panel-advanced-options",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '20px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    style: {
                                                                        display: 'block',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: 500,
                                                                        color: 'rgb(51, 65, 85)',
                                                                        marginBottom: '8px'
                                                                    },
                                                                    children: "AI Model"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1855,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        gap: '8px'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            onClick: ()=>setPremiumOptions((prev)=>({
                                                                                        ...prev,
                                                                                        model: 'gpt-4o-mini'
                                                                                    })),
                                                                            style: {
                                                                                flex: 1,
                                                                                padding: '10px 16px',
                                                                                fontSize: '0.8125rem',
                                                                                fontWeight: 500,
                                                                                color: premiumOptions.model === 'gpt-4o-mini' ? 'rgb(99, 102, 241)' : 'rgb(71, 85, 105)',
                                                                                backgroundColor: premiumOptions.model === 'gpt-4o-mini' ? 'rgb(238, 242, 255)' : 'rgb(255, 255, 255)',
                                                                                border: premiumOptions.model === 'gpt-4o-mini' ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease'
                                                                            },
                                                                            "data-testid": "button-model-mini",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    style: {
                                                                                        fontWeight: 600
                                                                                    },
                                                                                    children: "GPT-4o Mini"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/index.tsx",
                                                                                    lineNumber: 1884,
                                                                                    columnNumber: 27
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    style: {
                                                                                        fontSize: '0.6875rem',
                                                                                        color: 'rgb(100, 116, 139)',
                                                                                        marginTop: '4px'
                                                                                    },
                                                                                    children: "Fast & efficient"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/index.tsx",
                                                                                    lineNumber: 1885,
                                                                                    columnNumber: 27
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1867,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            onClick: ()=>setPremiumOptions((prev)=>({
                                                                                        ...prev,
                                                                                        model: 'gpt-4o'
                                                                                    })),
                                                                            style: {
                                                                                flex: 1,
                                                                                padding: '10px 16px',
                                                                                fontSize: '0.8125rem',
                                                                                fontWeight: 500,
                                                                                color: premiumOptions.model === 'gpt-4o' ? 'rgb(99, 102, 241)' : 'rgb(71, 85, 105)',
                                                                                backgroundColor: premiumOptions.model === 'gpt-4o' ? 'rgb(238, 242, 255)' : 'rgb(255, 255, 255)',
                                                                                border: premiumOptions.model === 'gpt-4o' ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease'
                                                                            },
                                                                            "data-testid": "button-model-full",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    style: {
                                                                                        fontWeight: 600
                                                                                    },
                                                                                    children: "GPT-4o"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/index.tsx",
                                                                                    lineNumber: 1906,
                                                                                    columnNumber: 27
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    style: {
                                                                                        fontSize: '0.6875rem',
                                                                                        color: 'rgb(100, 116, 139)',
                                                                                        marginTop: '4px'
                                                                                    },
                                                                                    children: "Higher quality"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/index.tsx",
                                                                                    lineNumber: 1907,
                                                                                    columnNumber: 27
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1889,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1866,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 1854,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    style: {
                                                                        display: 'block',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: 500,
                                                                        color: 'rgb(51, 65, 85)',
                                                                        marginBottom: '8px'
                                                                    },
                                                                    children: "Output Length"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1916,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        gap: '8px'
                                                                    },
                                                                    children: [
                                                                        'short',
                                                                        'standard',
                                                                        'detailed'
                                                                    ].map((length)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            onClick: ()=>setPremiumOptions((prev)=>({
                                                                                        ...prev,
                                                                                        length
                                                                                    })),
                                                                            style: {
                                                                                flex: 1,
                                                                                padding: '10px 16px',
                                                                                fontSize: '0.8125rem',
                                                                                fontWeight: 500,
                                                                                color: premiumOptions.length === length ? 'rgb(99, 102, 241)' : 'rgb(71, 85, 105)',
                                                                                backgroundColor: premiumOptions.length === length ? 'rgb(238, 242, 255)' : 'rgb(255, 255, 255)',
                                                                                border: premiumOptions.length === length ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                                                                                borderRadius: '6px',
                                                                                cursor: 'pointer',
                                                                                transition: 'all 0.2s ease',
                                                                                textTransform: 'capitalize'
                                                                            },
                                                                            "data-testid": `button-length-${length}`,
                                                                            children: length
                                                                        }, length, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1929,
                                                                            columnNumber: 27
                                                                        }, this))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1927,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 1915,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: 500,
                                                                        color: 'rgb(51, 65, 85)',
                                                                        marginBottom: '8px'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: "Creativity Level"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1967,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                fontSize: '0.75rem',
                                                                                color: 'rgb(100, 116, 139)'
                                                                            },
                                                                            children: [
                                                                                premiumOptions.creativity,
                                                                                "%"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1968,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1956,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '12px'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                fontSize: '0.75rem',
                                                                                color: 'rgb(100, 116, 139)'
                                                                            },
                                                                            children: "Precise"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1973,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                            type: "range",
                                                                            min: "0",
                                                                            max: "100",
                                                                            value: premiumOptions.creativity,
                                                                            onChange: (e)=>setPremiumOptions((prev)=>({
                                                                                        ...prev,
                                                                                        creativity: parseInt(e.target.value)
                                                                                    })),
                                                                            style: {
                                                                                flex: 1,
                                                                                height: '6px',
                                                                                borderRadius: '3px',
                                                                                appearance: 'none',
                                                                                backgroundColor: 'rgb(226, 232, 240)',
                                                                                cursor: 'pointer'
                                                                            },
                                                                            "data-testid": "slider-creativity"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1974,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                fontSize: '0.75rem',
                                                                                color: 'rgb(100, 116, 139)'
                                                                            },
                                                                            children: "Creative"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1990,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1972,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 1955,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                    htmlFor: "customInstructions",
                                                                    style: {
                                                                        display: 'block',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: 500,
                                                                        color: 'rgb(51, 65, 85)',
                                                                        marginBottom: '8px'
                                                                    },
                                                                    children: "Custom Instructions"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1996,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                                                    id: "customInstructions",
                                                                    placeholder: "Add any specific instructions for the AI (e.g., 'Use formal British English', 'Include a call-to-action', 'Keep paragraphs short')...",
                                                                    value: premiumOptions.customInstructions,
                                                                    onChange: (e)=>setPremiumOptions((prev)=>({
                                                                                ...prev,
                                                                                customInstructions: e.target.value
                                                                            })),
                                                                    rows: 3,
                                                                    style: {
                                                                        width: '100%',
                                                                        padding: '12px 16px',
                                                                        fontSize: '0.875rem',
                                                                        backgroundColor: 'rgb(255, 255, 255)',
                                                                        border: '1px solid rgb(226, 232, 240)',
                                                                        borderRadius: '6px',
                                                                        color: 'rgb(15, 23, 42)',
                                                                        resize: 'vertical',
                                                                        minHeight: '80px'
                                                                    },
                                                                    "data-testid": "input-custom-instructions"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 2008,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 1995,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 1852,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1842,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1775,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        disabled: isLoading,
                                        style: {
                                            width: '100%',
                                            marginTop: '24px',
                                            padding: '14px 32px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'rgb(255, 255, 255)',
                                            backgroundColor: isLoading ? 'rgb(148, 163, 184)' : 'rgb(99, 102, 241)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isLoading ? 'none' : '0 1px 3px rgba(99, 102, 241, 0.3)'
                                        },
                                        "data-testid": "button-generate",
                                        children: isLoading ? 'Generating...' : 'Generate'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2034,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 1133,
                                columnNumber: 11
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: '24px',
                                    padding: '16px',
                                    backgroundColor: 'rgb(254, 242, 242)',
                                    border: '1px solid rgb(254, 202, 202)',
                                    borderRadius: '8px',
                                    color: 'rgb(185, 28, 28)',
                                    fontSize: '0.875rem'
                                },
                                "data-testid": "error-message",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 2063,
                                columnNumber: 13
                            }, this),
                            output && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: '32px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '12px',
                                            gap: '12px',
                                            flexWrap: 'wrap'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: 'rgb(51, 65, 85)'
                                                },
                                                children: "Generated Content"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2092,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    gap: '8px',
                                                    flexWrap: 'wrap'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleRegenerate,
                                                        disabled: isLoading,
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            color: isLoading ? 'rgb(148, 163, 184)' : 'rgb(71, 85, 105)',
                                                            backgroundColor: 'rgb(255, 255, 255)',
                                                            border: '1px solid rgb(226, 232, 240)',
                                                            borderRadius: '6px',
                                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        "data-testid": "button-regenerate",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                style: {
                                                                    animation: isLoading ? 'spin 1s linear infinite' : 'none'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2135,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M21 3v5h-5"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2136,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 2122,
                                                                columnNumber: 21
                                                            }, this),
                                                            isLoading ? 'Regenerating...' : 'Regenerate'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 2102,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleCopyToClipboard,
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            color: copyState === 'copied' ? 'rgb(22, 163, 74)' : copyState === 'error' ? 'rgb(220, 38, 38)' : 'rgb(71, 85, 105)',
                                                            backgroundColor: copyState === 'copied' ? 'rgb(240, 253, 244)' : copyState === 'error' ? 'rgb(254, 242, 242)' : 'rgb(255, 255, 255)',
                                                            border: `1px solid ${copyState === 'copied' ? 'rgb(187, 247, 208)' : copyState === 'error' ? 'rgb(254, 202, 202)' : 'rgb(226, 232, 240)'}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        "data-testid": "button-copy",
                                                        children: copyState === 'copied' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    width: "14",
                                                                    height: "14",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                        points: "20 6 9 17 4 12"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2187,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 2177,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Copied!"
                                                            ]
                                                        }, void 0, true) : copyState === 'error' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    width: "14",
                                                                    height: "14",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                                            cx: "12",
                                                                            cy: "12",
                                                                            r: "10"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 2203,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                            x1: "15",
                                                                            y1: "9",
                                                                            x2: "9",
                                                                            y2: "15"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 2204,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                            x1: "9",
                                                                            y1: "9",
                                                                            x2: "15",
                                                                            y2: "15"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 2205,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 2193,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Failed"
                                                            ]
                                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    width: "14",
                                                                    height: "14",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                                                            x: "9",
                                                                            y: "9",
                                                                            width: "13",
                                                                            height: "13",
                                                                            rx: "2",
                                                                            ry: "2"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 2221,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                            d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 2222,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 2211,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Copy"
                                                            ]
                                                        }, void 0, true)
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 2140,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            position: 'relative'
                                                        },
                                                        ref: exportMenuRef,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>setShowExportMenu(!showExportMenu),
                                                                style: {
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '8px 16px',
                                                                    fontSize: '0.8125rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(71, 85, 105)',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease'
                                                                },
                                                                "data-testid": "button-export",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                        width: "14",
                                                                        height: "14",
                                                                        viewBox: "0 0 24 24",
                                                                        fill: "none",
                                                                        stroke: "currentColor",
                                                                        strokeWidth: "2",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 2258,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                                points: "7 10 12 15 17 10"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 2259,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                                x1: "12",
                                                                                y1: "15",
                                                                                x2: "12",
                                                                                y2: "3"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 2260,
                                                                                columnNumber: 25
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2248,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    "Export",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                        width: "12",
                                                                        height: "12",
                                                                        viewBox: "0 0 24 24",
                                                                        fill: "none",
                                                                        stroke: "currentColor",
                                                                        strokeWidth: "2",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        style: {
                                                                            transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                            transition: 'transform 0.2s ease'
                                                                        },
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                            points: "6 9 12 15 18 9"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 2277,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2263,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 2229,
                                                                columnNumber: 21
                                                            }, this),
                                                            showExportMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    position: 'absolute',
                                                                    top: 'calc(100% + 4px)',
                                                                    right: 0,
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                                    zIndex: 50,
                                                                    minWidth: '160px',
                                                                    overflow: 'hidden'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: handleExportText,
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            color: 'rgb(51, 65, 85)',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left'
                                                                        },
                                                                        "data-testid": "button-export-txt",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                                width: "16",
                                                                                height: "16",
                                                                                viewBox: "0 0 24 24",
                                                                                fill: "none",
                                                                                stroke: "currentColor",
                                                                                strokeWidth: "2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2315,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                                        points: "14 2 14 8 20 8"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2316,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                                        x1: "16",
                                                                                        y1: "13",
                                                                                        x2: "8",
                                                                                        y2: "13"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2317,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                                                        x1: "16",
                                                                                        y1: "17",
                                                                                        x2: "8",
                                                                                        y2: "17"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2318,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 2314,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            "Plain Text (.txt)"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2295,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: handleExportPDF,
                                                                        disabled: exportState === 'exporting',
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            color: exportState === 'exporting' ? 'rgb(148, 163, 184)' : 'rgb(51, 65, 85)',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: exportState === 'exporting' ? 'not-allowed' : 'pointer',
                                                                            textAlign: 'left'
                                                                        },
                                                                        "data-testid": "button-export-pdf",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                                width: "16",
                                                                                height: "16",
                                                                                viewBox: "0 0 24 24",
                                                                                fill: "none",
                                                                                stroke: "rgb(239, 68, 68)",
                                                                                strokeWidth: "2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2343,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                                        points: "14 2 14 8 20 8"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2344,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 2342,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            "PDF Document (.pdf)"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2322,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: handleExportWord,
                                                                        disabled: exportState === 'exporting',
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            color: exportState === 'exporting' ? 'rgb(148, 163, 184)' : 'rgb(51, 65, 85)',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: exportState === 'exporting' ? 'not-allowed' : 'pointer',
                                                                            textAlign: 'left'
                                                                        },
                                                                        "data-testid": "button-export-docx",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                                width: "16",
                                                                                height: "16",
                                                                                viewBox: "0 0 24 24",
                                                                                fill: "none",
                                                                                stroke: "rgb(37, 99, 235)",
                                                                                strokeWidth: "2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2369,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                                        points: "14 2 14 8 20 8"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 2370,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 2368,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            "Word Document (.docx)"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2348,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 2281,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 2228,
                                                        columnNumber: 19
                                                    }, this),
                                                    isAuthenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: saveGeneration,
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            color: 'rgb(255, 255, 255)',
                                                            backgroundColor: 'rgb(99, 102, 241)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        "data-testid": "button-save",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2407,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                        points: "17 21 17 13 7 13 7 21"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2408,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                                                        points: "7 3 7 8 15 8"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 2409,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 2397,
                                                                columnNumber: 23
                                                            }, this),
                                                            "Save"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 2378,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2101,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2082,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        readOnly: true,
                                        value: output,
                                        style: {
                                            width: '100%',
                                            minHeight: '400px',
                                            padding: '24px',
                                            fontSize: '0.875rem',
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            backgroundColor: 'rgb(248, 250, 252)',
                                            border: '1px solid rgb(226, 232, 240)',
                                            borderRadius: '8px',
                                            color: 'rgb(15, 23, 42)',
                                            resize: 'vertical',
                                            lineHeight: 1.6
                                        },
                                        "data-testid": "output-content"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2416,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 2081,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 1079,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                        style: {
                            marginTop: '64px',
                            padding: '24px 16px',
                            borderTop: '1px solid rgb(226, 232, 240)',
                            textAlign: 'center'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                fontSize: '0.875rem',
                                color: 'rgb(100, 116, 139)'
                            },
                            "data-testid": "text-footer",
                            children: "BizKit AI – Beta v1.0"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 2447,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 2439,
                        columnNumber: 9
                    }, this),
                    showSubscriptionPrompt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        },
                        onClick: ()=>setShowSubscriptionPrompt(false),
                        "data-testid": "modal-subscription-backdrop",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '32px',
                                maxWidth: '480px',
                                width: '90%',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            },
                            onClick: (e)=>e.stopPropagation(),
                            "data-testid": "modal-subscription-content",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    textAlign: 'center'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgb(238, 242, 255)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 16px'
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            xmlns: "http://www.w3.org/2000/svg",
                                            width: "32",
                                            height: "32",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "rgb(99, 102, 241)",
                                            strokeWidth: "2",
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2512,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 2501,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2489,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        style: {
                                            fontSize: '1.5rem',
                                            fontWeight: 600,
                                            color: 'rgb(15, 23, 42)',
                                            marginBottom: '8px'
                                        },
                                        "data-testid": "text-subscription-title",
                                        children: "Free Trial Used"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2515,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: '1rem',
                                            color: 'rgb(100, 116, 139)',
                                            marginBottom: '24px',
                                            lineHeight: 1.6
                                        },
                                        "data-testid": "text-subscription-message",
                                        children: "You've used your free generation. Subscribe to unlock unlimited access to all content generation tools."
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2526,
                                        columnNumber: 17
                                    }, this),
                                    !isAuthenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginBottom: '16px'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: '0.875rem',
                                                    color: 'rgb(100, 116, 139)',
                                                    marginBottom: '12px'
                                                },
                                                children: "Please sign in first to subscribe:"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2540,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    setShowSubscriptionPrompt(false);
                                                    window.location.href = '/api/login';
                                                },
                                                style: {
                                                    width: '100%',
                                                    padding: '14px 24px',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    backgroundColor: 'rgb(99, 102, 241)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    marginBottom: '8px'
                                                },
                                                "data-testid": "button-login-from-modal",
                                                children: "Sign In with Replit"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2543,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2539,
                                        columnNumber: 19
                                    }, this),
                                    isAuthenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginBottom: '16px'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    fontSize: '0.875rem',
                                                    color: 'rgb(100, 116, 139)',
                                                    marginBottom: '12px'
                                                },
                                                children: "Contact us to subscribe and get unlimited access:"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2570,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                href: "mailto:support@bizkit.ai?subject=BizKit AI Subscription",
                                                style: {
                                                    display: 'block',
                                                    width: '100%',
                                                    padding: '14px 24px',
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    backgroundColor: 'rgb(99, 102, 241)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    textDecoration: 'none',
                                                    textAlign: 'center',
                                                    boxSizing: 'border-box'
                                                },
                                                "data-testid": "button-contact-subscribe",
                                                children: "Contact to Subscribe"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 2573,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2569,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setShowSubscriptionPrompt(false),
                                        style: {
                                            width: '100%',
                                            padding: '12px 24px',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'rgb(100, 116, 139)',
                                            backgroundColor: 'transparent',
                                            border: '1px solid rgb(226, 232, 240)',
                                            borderRadius: '8px',
                                            cursor: 'pointer'
                                        },
                                        "data-testid": "button-close-subscription-modal",
                                        children: "Maybe Later"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 2597,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 2488,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 2476,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 2460,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 759,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s1(Home, "ocffIRcqGo4qX5wVvSAbi+WZ8us=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c1 = Home;
var _c, _c1;
__turbopack_context__.k.register(_c, "LanguagePicker");
__turbopack_context__.k.register(_c1, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/index.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/index.tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/index\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/index.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__1855b2fe._.js.map