import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Eye, LayoutGrid, Undo2, Redo2, Save, Cloud, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { MenuNode, MenuNodeData } from './MenuNode';
import { ActionNode, ActionNodeData } from './ActionNode';
import { BotPreview } from './BotPreview';
import { PhoneFrame } from '@/components/layout/PhoneFrame';
import { FabMenu } from './FabMenu';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ActionType, ACTION_CATEGORIES, MAX_MENUS_PER_PROJECT, MAX_ACTION_NODES_PER_PROJECT } from '@/types/bot';

const nodeTypes = { menuNode: MenuNode, actionNode: ActionNode };

export function BuilderCanvas() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();

  const {
    projects, setCurrentProject, getCurrentProject, currentMenuId, setCurrentMenu,
    addMenu, duplicateMenu, updateMenu, deleteMenu, updateButton, justMovedButtonId,
    addActionNode, updateActionNode, deleteActionNode, duplicateActionNode,
    selectedActionNodeId, setSelectedActionNode, restoreProject,
  } = useProjectStore();

  const [showPreview, setShowPreview] = useState(false);
  const [nodesKey, setNodesKey] = useState(0);
  const [previewMenuId, setPreviewMenuId] = useState<string | null>(null);
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);

  useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const project = useMemo(() => {
    if (projectId) return projects.find((p) => p.id === projectId) || null;
    return getCurrentProject();
  }, [projectId, projects, getCurrentProject]);

  const { undo, redo, canUndo, canRedo } = useUndoRedo(project, restoreProject);
  const { status: saveStatus, forceSave } = useAutoSave(project, 30000);

  useEffect(() => {
    if (projectId && !project) navigate('/projects');
  }, [projectId, project, navigate]);

  const menuNodes: Node<MenuNodeData>[] = useMemo(() => {
    if (!project) return [];
    const menuIdSet = new Set(project.menus.map((m) => m.id));

    return project.menus.map((menu, index) => {
      const connectedButtonIds = menu.buttons
        .filter((b) => (b.targetMenuId && menuIdSet.has(b.targetMenuId)) || b.targetActionId)
        .map((b) => b.id);

      return {
        id: menu.id,
        type: 'menuNode',
        position: menu.position || { x: index * 300, y: index * 100 },
        data: {
          menu, isSelected: menu.id === currentMenuId, isRoot: menu.id === project.rootMenuId,
          connectedButtonIds, justMovedButtonId,
          onEdit: () => setCurrentMenu(menu.id),
          onDelete: () => { deleteMenu(menu.id); setNodesKey((k) => k + 1); },
          onDuplicate: () => { duplicateMenu(menu.id); setNodesKey((k) => k + 1); },
        },
      };
    });
  }, [project?.menus, project?.rootMenuId, currentMenuId, justMovedButtonId, setCurrentMenu, duplicateMenu, deleteMenu]);

  const actionNodes: Node<ActionNodeData>[] = useMemo(() => {
    if (!project?.actionNodes) return [];
    return project.actionNodes.map((actionNode) => ({
      id: actionNode.id, type: 'actionNode', position: actionNode.position,
      data: {
        actionNode, isSelected: actionNode.id === selectedActionNodeId,
        onEdit: () => setSelectedActionNode(actionNode.id),
        onDelete: () => { deleteActionNode(actionNode.id); setNodesKey((k) => k + 1); },
        onDuplicate: () => duplicateActionNode(actionNode.id),
      },
    }));
  }, [project?.actionNodes, selectedActionNodeId, setSelectedActionNode, deleteActionNode, duplicateActionNode]);

  const nodes = useMemo(() => [...menuNodes, ...actionNodes], [menuNodes, actionNodes]);

  const edges: Edge[] = useMemo(() => {
    if (!project) return [];
    const edgeList: Edge[] = [];
    const menuIdSet = new Set(project.menus.map((m) => m.id));
    const actionNodeIdSet = new Set((project.actionNodes || []).map((an) => an.id));

    project.menus.forEach((menu) => {
      menu.buttons.forEach((button) => {
        if (button.targetActionId && actionNodeIdSet.has(button.targetActionId)) {
          edgeList.push({
            id: `btn-action-${menu.id}-${button.id}`, source: menu.id, sourceHandle: button.id,
            target: button.targetActionId, animated: true, label: button.text,
            style: { strokeWidth: 2, stroke: 'hsl(200 100% 50%)' },
          });
        } else if (button.targetMenuId && menuIdSet.has(button.targetMenuId)) {
          edgeList.push({
            id: `btn-${menu.id}-${button.id}`, source: menu.id, sourceHandle: button.id,
            target: button.targetMenuId, animated: true, label: button.text,
            style: { strokeWidth: 2, stroke: 'hsl(145 65% 45%)' },
          });
        }
      });
    });

    (project.actionNodes || []).forEach((actionNode) => {
      if (actionNode.nextNodeId && (menuIdSet.has(actionNode.nextNodeId) || actionNodeIdSet.has(actionNode.nextNodeId))) {
        edgeList.push({
          id: `action-${actionNode.id}-next`, source: actionNode.id, target: actionNode.nextNodeId,
          animated: true, style: { strokeWidth: 2, stroke: 'hsl(280 70% 50%)' },
        });
      }
    });

    return edgeList;
  }, [project?.menus, project?.actionNodes]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => { setFlowNodes(nodes); setFlowEdges(edges); }, [nodes, edges, setFlowNodes, setFlowEdges, nodesKey]);

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;
    const sourceMenu = project?.menus.find(m => m.id === params.source);
    const targetIsMenu = project?.menus.some(m => m.id === params.target);
    const targetIsAction = project?.actionNodes?.some(an => an.id === params.target);

    if (params.sourceHandle && sourceMenu) {
      const button = sourceMenu.buttons.find(b => b.id === params.sourceHandle);
      if (button) {
        updateMenu(params.source, {
          buttons: sourceMenu.buttons.map(b =>
            b.id === button.id
              ? { ...b, targetActionId: targetIsAction ? params.target! : undefined, targetMenuId: targetIsMenu ? params.target! : undefined }
              : b
          )
        });
        setNodesKey(k => k + 1);
        return;
      }
    }
    const sourceActionNode = project?.actionNodes?.find(an => an.id === params.source);
    if (sourceActionNode) {
      updateActionNode(params.source, { nextNodeId: params.target, nextNodeType: targetIsMenu ? 'menu' : 'action' });
      setNodesKey(k => k + 1);
      return;
    }
    setFlowEdges((eds) => addEdge(params, eds));
  }, [setFlowEdges, project?.menus, project?.actionNodes, updateMenu, updateActionNode]);

  const handleAddMenu = useCallback(() => {
    if (project && project.menus.length >= MAX_MENUS_PER_PROJECT) {
      toast({ title: 'Достигнут лимит', description: `Максимум ${MAX_MENUS_PER_PROJECT} меню`, variant: 'destructive' });
      return;
    }
    addMenu();
    setNodesKey(k => k + 1);
  }, [addMenu, project, toast]);

  const handleAddActionNode = useCallback((type: ActionType) => {
    if (project && (project.actionNodes || []).length >= MAX_ACTION_NODES_PER_PROJECT) {
      toast({ title: 'Достигнут лимит', description: `Максимум ${MAX_ACTION_NODES_PER_PROJECT} действий`, variant: 'destructive' });
      return;
    }
    const lastMenu = project?.menus[project.menus.length - 1];
    addActionNode(type, { x: (lastMenu?.position?.x || 0) + 350, y: (lastMenu?.position?.y || 100) + Math.random() * 100 });
    setNodesKey(k => k + 1);
  }, [addActionNode, project, toast]);

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'actionNode') updateActionNode(node.id, { position: node.position });
    else updateMenu(node.id, { position: node.position });
  }, [updateMenu, updateActionNode]);

  const previewMenu = previewMenuId
    ? project?.menus.find((m) => m.id === previewMenuId)
    : project?.menus.find((m) => m.id === project.rootMenuId) || project?.menus[0] || null;

  if (!project) return <LoadingScreen />;

  return (
    <div className="h-screen w-full relative">
      <ReactFlow
        nodes={flowNodes} edges={flowEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeDragStop={handleNodeDragStop} nodeTypes={nodeTypes}
        fitView={false} defaultViewport={{ x: 100, y: 100, zoom: 0.8 }} minZoom={0.3} maxZoom={1.5} className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!bg-card !border-border !rounded-xl" />
        <MiniMap className="!bg-card/80 !border-border !rounded-xl" nodeColor={(node) => node.id === project.rootMenuId ? 'hsl(145 65% 45%)' : 'hsl(200 100% 40%)'} />
      </ReactFlow>

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/projects')} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Назад
          </Button>
          <div className="bg-card/80 backdrop-blur border border-border rounded-lg px-4 py-2">
            <h1 className="text-sm font-semibold text-foreground">{project.name}</h1>
          </div>
          <div className="bg-card/80 backdrop-blur border border-border rounded-lg px-3 py-2 flex items-center gap-2">
            {saveStatus === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Сохранение...</span></>}
            {saveStatus === 'saved' && <><Cloud className="w-3.5 h-3.5 text-green-500" /><span className="text-xs text-green-500">Сохранено</span></>}
            <button onClick={forceSave} disabled={saveStatus === 'saving'} className="p-1 rounded hover:bg-muted/50"><Save className="w-3.5 h-3.5 text-muted-foreground" /></button>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8"><Undo2 className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8"><Redo2 className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="gap-2"><Eye className="w-4 h-4" /> Превью</Button>
        </div>
      </div>

      <FabMenu onAddMenu={handleAddMenu} onAddAction={handleAddActionNode} />

      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="absolute top-20 right-4 z-40">
            <PhoneFrame scale={0.85}>
              <BotPreview
                menu={previewMenu} menus={project.menus} actionNodes={project.actionNodes || []} botName={project.name}
                onNavigateToMenu={(menuId) => { if (previewMenu) setPreviewHistory(prev => [...prev, previewMenu.id]); setPreviewMenuId(menuId); }}
                onBack={() => { const newHistory = [...previewHistory]; const prevId = newHistory.pop(); setPreviewHistory(newHistory); setPreviewMenuId(prevId || null); }}
                canGoBack={previewHistory.length > 0}
              />
            </PhoneFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
