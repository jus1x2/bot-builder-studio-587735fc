import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
  EdgeProps,
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Play, Eye, ChevronLeft, Download, ShoppingCart, Bot, Scissors, 
  LayoutGrid, Trash2, Undo2, Redo2, Save, Cloud, CloudOff, Loader2, WifiOff, Package
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { MenuNode, MenuNodeData } from './MenuNode';
import { ActionNode, ActionNodeData } from './ActionNode';
import { MenuEditor } from './MenuEditor';
import { ActionNodeEditor } from './ActionNodeEditor';
import { BotPreview } from './BotPreview';
import { PhoneFrame } from '@/components/layout/PhoneFrame';
import { ExportImportModal } from './ExportImportModal';
import { PurchaseRequestModal } from './PurchaseRequestModal';
import { TelegramConnectModal } from './TelegramConnectModal';
import { ProductCatalogModal } from './ProductCatalogModal';
import { FabMenu } from './FabMenu';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useTelegram } from '@/contexts/TelegramContext';
import { ACTION_CATEGORIES, ActionType, ACTION_INFO, MAX_MENUS_PER_PROJECT, MAX_ACTION_NODES_PER_PROJECT } from '@/types/bot';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const nodeTypes = {
  menuNode: MenuNode,
  actionNode: ActionNode,
};

// Helper to get point on bezier at t (0-1)
function getBezierPoint(
  t: number,
  sourceX: number, sourceY: number,
  targetX: number, targetY: number,
  sourcePosition: any, targetPosition: any
): { x: number; y: number } {
  const curvature = 0.25;
  const dx = Math.abs(targetX - sourceX);

  let c1x = sourceX, c1y = sourceY, c2x = targetX, c2y = targetY;

  if (sourcePosition === 'right') c1x = sourceX + dx * curvature;
  if (sourcePosition === 'left') c1x = sourceX - dx * curvature;
  if (targetPosition === 'left') c2x = targetX - dx * curvature;
  if (targetPosition === 'right') c2x = targetX + dx * curvature;

  const mt = 1 - t;
  const x = mt*mt*mt*sourceX + 3*mt*mt*t*c1x + 3*mt*t*t*c2x + t*t*t*targetX;
  const y = mt*mt*mt*sourceY + 3*mt*mt*t*c1y + 3*mt*t*t*c2y + t*t*t*targetY;

  return { x, y };
}

// Custom edge with hover effect for deletion and draggable label along the path
function CuttableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const savedPosition = (data as any)?.labelPosition ?? 0.5;
  const onLabelDrag = (data as any)?.onLabelDrag;

  const [isDragging, setIsDragging] = useState(false);
  const [labelPosition, setLabelPosition] = useState(savedPosition);
  const dragStartRef = useRef({ clientX: 0, startPosition: 0 });

  const labelPoint = getBezierPoint(labelPosition, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      startPosition: labelPosition,
    };
  }, [labelPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const edgeLength = Math.sqrt(
        Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
      );

      const edgeDirX = (targetX - sourceX) / edgeLength;
      const edgeDirY = (targetY - sourceY) / edgeLength;

      const dx = e.clientX - dragStartRef.current.clientX;

      const moveAlongEdge = dx * edgeDirX;
      const positionDelta = moveAlongEdge / edgeLength;

      const newPosition = Math.max(0.1, Math.min(0.9, dragStartRef.current.startPosition + positionDelta));
      setLabelPosition(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onLabelDrag) {
        onLabelDrag(labelPosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, labelPosition, onLabelDrag, sourceX, sourceY, targetX, targetY]);

  useEffect(() => {
    if (!isDragging) {
      setLabelPosition(savedPosition);
    }
  }, [savedPosition, isDragging]);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer', pointerEvents: 'stroke' as any }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            className={`z-50 nodrag nopan ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPoint.x}px, ${labelPoint.y}px)`,
              pointerEvents: 'all',
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`px-2 py-1 rounded-md bg-popover/95 border shadow-sm text-[10px] font-medium text-foreground max-w-[220px] truncate transition-all select-none ${
              isDragging ? 'border-primary shadow-md scale-105' : 'border-border hover:border-primary/50'
            }`}>
              {String(label)}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = {
  cuttable: CuttableEdge,
};

export function BuilderCanvas() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();

  const {
    projects,
    setCurrentProject,
    getCurrentProject,
    currentMenuId,
    setCurrentMenu,
    addMenu,
    duplicateMenu,
    updateMenu,
    deleteMenu,
    updateButton,
    justMovedButtonId,
    addActionNode,
    updateActionNode,
    deleteActionNode,
    duplicateActionNode,
    selectedActionNodeId,
    setSelectedActionNode,
    restoreProject,
  } = useProjectStore();

  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showTelegram, setShowTelegram] = useState(false);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [nodesKey, setNodesKey] = useState(0);
  const [previewMenuId, setPreviewMenuId] = useState<string | null>(null);
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);
  const [edgeToDelete, setEdgeToDelete] = useState<{ edgeId: string; menuId: string; buttonId: string; buttonText: string } | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<{ menuId: string; menuName: string } | null>(null);
  const [actionNodeToDelete, setActionNodeToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showActionEditor, setShowActionEditor] = useState(false);

  useEffect(() => {
    if (projectId) setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  const project = useMemo(() => {
    if (projectId) return projects.find((p) => p.id === projectId) || null;
    return getCurrentProject();
  }, [projectId, projects, getCurrentProject]);

  const { undo, redo, canUndo, canRedo } = useUndoRedo(project, restoreProject);
  const { status: saveStatus, lastSaved, forceSave } = useAutoSave(project, 30000);
  const { isOnline } = useOnlineStatus();
  const { profile } = useTelegram();
  const { isSyncing, saveToCloud } = useCloudSync(profile?.id);

  const selectedActionNode = useMemo(() => {
    if (!selectedActionNodeId || !project?.actionNodes) return null;
    return project.actionNodes.find(an => an.id === selectedActionNodeId) || null;
  }, [selectedActionNodeId, project?.actionNodes]);

  useEffect(() => {
    if (projectId && !project) {
      navigate('/projects');
    }
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
          menu,
          isSelected: menu.id === currentMenuId,
          isRoot: menu.id === project.rootMenuId,
          connectedButtonIds,
          justMovedButtonId,
          onEdit: () => {
            setCurrentMenu(menu.id);
            setShowEditor(true);
          },
          onDelete: () => {
            setMenuToDelete({ menuId: menu.id, menuName: menu.name });
          },
          onDuplicate: () => {
            duplicateMenu(menu.id);
            setNodesKey((k) => k + 1);
            toast({
              title: 'Меню дублировано',
              description: `Создана копия "${menu.name}"`,
            });
          },
        },
      };
    });
  }, [project?.menus, project?.rootMenuId, currentMenuId, justMovedButtonId, setCurrentMenu, duplicateMenu, toast]);

  const actionNodes: Node<ActionNodeData>[] = useMemo(() => {
    if (!project?.actionNodes) return [];

    return project.actionNodes.map((actionNode) => ({
      id: actionNode.id,
      type: 'actionNode',
      position: actionNode.position,
      data: {
        actionNode,
        isSelected: actionNode.id === selectedActionNodeId,
        onEdit: () => {
          setSelectedActionNode(actionNode.id);
          setShowActionEditor(true);
        },
        onDelete: () => {
          const actionInfo = ACTION_CATEGORIES.basic.actions.includes(actionNode.type as any)
            ? 'Базовое действие'
            : actionNode.type;
          setActionNodeToDelete({ id: actionNode.id, name: actionInfo });
        },
        onDuplicate: () => {
          duplicateActionNode(actionNode.id);
        },
      },
    }));
  }, [project?.actionNodes, selectedActionNodeId, setSelectedActionNode, duplicateActionNode]);

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
            id: `btn-action-${menu.id}-${button.id}`,
            source: menu.id,
            sourceHandle: button.id,
            target: button.targetActionId,
            type: 'cuttable',
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: 'hsl(200 100% 50%)',
            },
            label: button.text,
            data: {
              menuId: menu.id,
              buttonId: button.id,
              buttonText: button.text,
              isActionConnection: true,
              labelPosition: button.labelPosition ?? 0.5,
              onLabelDrag: (position: number) => {
                updateButton(menu.id, button.id, { labelPosition: position });
              },
            },
          });
        } else if (button.targetMenuId && menuIdSet.has(button.targetMenuId)) {
          edgeList.push({
            id: `btn-${menu.id}-${button.id}`,
            source: menu.id,
            sourceHandle: button.id,
            target: button.targetMenuId,
            type: 'cuttable',
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: 'hsl(145 65% 45%)',
            },
            label: button.text,
            data: {
              menuId: menu.id,
              buttonId: button.id,
              buttonText: button.text,
              labelPosition: button.labelPosition ?? 0.5,
              onLabelDrag: (position: number) => {
                updateButton(menu.id, button.id, { labelPosition: position });
              },
            },
          });
        }
      });
    });

    (project.actionNodes || []).forEach((actionNode) => {
      // Check if this is a multi-output action (random_result)
      const isMultiOutput = actionNode.type === 'random_result';
      
      if (isMultiOutput && actionNode.outcomes) {
        // Create edges for each outcome
        actionNode.outcomes.forEach((outcome, index) => {
          if (outcome.targetId) {
            const isMenuTarget = menuIdSet.has(outcome.targetId);
            const isActionTarget = actionNodeIdSet.has(outcome.targetId);
            
            if (isMenuTarget || isActionTarget) {
              edgeList.push({
                id: `action-${actionNode.id}-outcome-${outcome.id}`,
                source: actionNode.id,
                sourceHandle: outcome.id,
                target: outcome.targetId,
                type: 'cuttable',
                animated: true,
                style: {
                  strokeWidth: 2,
                  stroke: 'hsl(330 80% 60%)', // Pink for random outcomes
                },
                label: `${Math.round(100 / (actionNode.config?.outcomeCount || 2))}%`,
                data: {
                  actionNodeId: actionNode.id,
                  outcomeId: outcome.id,
                  isActionConnection: true,
                  isMultiOutput: true,
                },
              });
            }
          }
        });
      } else if (actionNode.nextNodeId) {
        const isMenuTarget = menuIdSet.has(actionNode.nextNodeId);
        const isActionTarget = actionNodeIdSet.has(actionNode.nextNodeId);

        if (isMenuTarget || isActionTarget) {
          edgeList.push({
            id: `action-${actionNode.id}-next`,
            source: actionNode.id,
            target: actionNode.nextNodeId,
            type: 'cuttable',
            animated: true,
            style: {
              strokeWidth: 2,
              stroke: isMenuTarget ? 'hsl(145 65% 45%)' : 'hsl(280 70% 50%)',
            },
            data: {
              actionNodeId: actionNode.id,
              isActionConnection: true,
            },
          });
        }
      }
    });

    return edgeList;
  }, [project?.menus, project?.actionNodes, updateButton]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, [nodes, edges, setFlowNodes, setFlowEdges, nodesKey]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const sourceMenu = project?.menus.find(m => m.id === params.source);
      const sourceActionNode = project?.actionNodes?.find(an => an.id === params.source);
      const targetIsMenu = project?.menus.some(m => m.id === params.target);
      const targetIsAction = project?.actionNodes?.some(an => an.id === params.target);

      if (params.sourceHandle && sourceMenu) {
        const button = sourceMenu.buttons.find(b => b.id === params.sourceHandle);
        if (button) {
          if (targetIsAction) {
            updateMenu(params.source, {
              buttons: sourceMenu.buttons.map(b =>
                b.id === button.id ? { ...b, targetActionId: params.target!, targetMenuId: undefined } : b
              )
            });
          } else if (targetIsMenu) {
            updateMenu(params.source, {
              buttons: sourceMenu.buttons.map(b =>
                b.id === button.id ? { ...b, targetMenuId: params.target!, targetActionId: undefined } : b
              )
            });
          }
          setNodesKey(k => k + 1);
          return;
        }
      }

      if (sourceActionNode) {
        const targetIsMenu = project?.menus.some(m => m.id === params.target);
        const isMultiOutput = sourceActionNode.type === 'random_result';
        
        if (isMultiOutput && params.sourceHandle) {
          // Update the specific outcome's target
          const updatedOutcomes = (sourceActionNode.outcomes || []).map(outcome =>
            outcome.id === params.sourceHandle
              ? { ...outcome, targetId: params.target!, targetType: (targetIsMenu ? 'menu' : 'action') as 'menu' | 'action' }
              : outcome
          );
          updateActionNode(params.source, { outcomes: updatedOutcomes });
        } else {
          // Standard single-output action
          updateActionNode(params.source, {
            nextNodeId: params.target,
            nextNodeType: targetIsMenu ? 'menu' : 'action',
          });
        }
        setNodesKey(k => k + 1);
        return;
      }

      setFlowEdges((eds) => addEdge(params, eds));
    },
    [setFlowEdges, project?.menus, project?.actionNodes, updateMenu, updateActionNode]
  );

  const handleAddMenu = useCallback(() => {
    if (project && project.menus.length >= MAX_MENUS_PER_PROJECT) {
      toast({
        title: 'Достигнут лимит',
        description: `Максимум ${MAX_MENUS_PER_PROJECT} меню в проекте`,
        variant: 'destructive',
      });
      return;
    }
    const newMenu = addMenu();
    if (newMenu) {
      setNodesKey(k => k + 1);
      setShowEditor(true);
    }
  }, [addMenu, project, toast]);

  const handleAddActionNode = useCallback((type: ActionType) => {
    if (project && (project.actionNodes || []).length >= MAX_ACTION_NODES_PER_PROJECT) {
      toast({
        title: 'Достигнут лимит',
        description: `Максимум ${MAX_ACTION_NODES_PER_PROJECT} действий в проекте`,
        variant: 'destructive',
      });
      return;
    }
    const lastMenu = project?.menus[project.menus.length - 1];
    const position = {
      x: (lastMenu?.position?.x || 0) + 350,
      y: (lastMenu?.position?.y || 100) + Math.random() * 100,
    };
    const newNode = addActionNode(type, position);
    if (newNode) {
      setNodesKey(k => k + 1);
    }
  }, [addActionNode, project, toast]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const isActionNode = node.type === 'actionNode';
      if (isActionNode) {
        setSelectedActionNode(node.id);
        setCurrentMenu(null);
      } else {
        setCurrentMenu(node.id);
        setSelectedActionNode(null);
      }
    },
    [setCurrentMenu, setSelectedActionNode]
  );

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'actionNode') {
        updateActionNode(node.id, { position: node.position });
      } else {
        updateMenu(node.id, { position: node.position });
      }
    },
    [updateMenu, updateActionNode]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const edgeData = edge.data as { menuId?: string; buttonId?: string; buttonText?: string; actionNodeId?: string } | undefined;

      if (edgeData?.actionNodeId) {
        updateActionNode(edgeData.actionNodeId, { nextNodeId: undefined, nextNodeType: undefined });
        setNodesKey(k => k + 1);
        toast({ title: 'Связь удалена' });
        return;
      }

      if (edgeData?.menuId && edgeData?.buttonId) {
        const menu = project?.menus.find(m => m.id === edgeData.menuId);
        const button = menu?.buttons.find(b => b.id === edgeData.buttonId);
        if (button) {
          setEdgeToDelete({
            edgeId: edge.id,
            menuId: edgeData.menuId,
            buttonId: edgeData.buttonId,
            buttonText: button.text
          });
        }
      }
    },
    [project?.menus, updateActionNode, toast]
  );

  const handleDeleteConnection = useCallback(() => {
    if (!edgeToDelete || !project) return;

    const { menuId, buttonId } = edgeToDelete;
    const menu = project.menus.find(m => m.id === menuId);
    if (menu) {
      updateMenu(menuId, {
        buttons: menu.buttons.map(b =>
          b.id === buttonId ? { ...b, targetMenuId: undefined, targetActionId: undefined } : b
        )
      });
      setNodesKey(k => k + 1);
      toast({
        title: 'Связь удалена',
        description: `Связь кнопки "${edgeToDelete.buttonText}" удалена`,
      });
    }
    setEdgeToDelete(null);
  }, [edgeToDelete, project, updateMenu, toast]);

  const handleAutoLayout = useCallback(() => {
    if (!project || project.menus.length === 0) return;

    const NODE_WIDTH = 280;
    const NODE_HEIGHT = 200;
    const HORIZONTAL_GAP = 120;
    const VERTICAL_GAP = 60;

    const children = new Map<string, string[]>();
    const parents = new Map<string, string[]>();

    project.menus.forEach(menu => {
      children.set(menu.id, []);
      parents.set(menu.id, []);
    });

    project.menus.forEach(menu => {
      menu.buttons.forEach(button => {
        if (button.targetMenuId && children.has(button.targetMenuId)) {
          children.get(menu.id)!.push(button.targetMenuId);
          parents.get(button.targetMenuId)!.push(menu.id);
        }
      });
    });

    const rootId = project.rootMenuId ||
      project.menus.find(m => parents.get(m.id)!.length === 0)?.id ||
      project.menus[0].id;

    const levels = new Map<string, number>();
    const queue: string[] = [rootId];
    levels.set(rootId, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current)!;

      children.get(current)?.forEach(childId => {
        if (!levels.has(childId)) {
          levels.set(childId, currentLevel + 1);
          queue.push(childId);
        }
      });
    }

    project.menus.forEach((menu, idx) => {
      if (!levels.has(menu.id)) {
        levels.set(menu.id, Math.floor(idx / 3));
      }
    });

    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, id) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(id);
    });

    const positions = new Map<string, { x: number; y: number }>();

    levelGroups.forEach((nodeIds, level) => {
      const totalHeight = nodeIds.length * NODE_HEIGHT + (nodeIds.length - 1) * VERTICAL_GAP;
      const startY = -totalHeight / 2 + NODE_HEIGHT / 2;

      nodeIds.forEach((id, index) => {
        positions.set(id, {
          x: level * (NODE_WIDTH + HORIZONTAL_GAP) + 100,
          y: startY + index * (NODE_HEIGHT + VERTICAL_GAP) + 200,
        });
      });
    });

    project.menus.forEach(menu => {
      const pos = positions.get(menu.id);
      if (pos) {
        updateMenu(menu.id, { position: pos });
      }
    });

    setNodesKey(k => k + 1);
    toast({
      title: 'Авто-раскладка применена',
      description: `Размещено ${project.menus.length} меню`,
    });
  }, [project, updateMenu, toast]);

  const currentMenu = project?.menus.find((m) => m.id === currentMenuId) || null;

  const getDefaultPreviewMenu = () => {
    return project?.menus.find((m) => m.id === project.rootMenuId) || project?.menus[0] || null;
  };

  const previewMenu = previewMenuId
    ? project?.menus.find((m) => m.id === previewMenuId) || getDefaultPreviewMenu()
    : getDefaultPreviewMenu();

  const handlePreviewNavigate = (buttonId: string) => {
    const button = previewMenu?.buttons.find(b => b.id === buttonId);
    if (button?.targetMenuId && previewMenu) {
      setPreviewHistory(prev => [...prev, previewMenu.id]);
      setPreviewMenuId(button.targetMenuId);
    }
  };

  const handlePreviewBack = () => {
    if (previewHistory.length > 0) {
      const newHistory = [...previewHistory];
      const prevMenuId = newHistory.pop();
      setPreviewHistory(newHistory);
      setPreviewMenuId(prevMenuId || null);
    }
  };

  if (!project) {
    return <LoadingScreen />;
  }

  return (
    <div className="tg-app-container touch-action-pan">
      {/* React Flow Canvas */}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={false}
        defaultViewport={{ x: 100, y: 100, zoom: 0.8 }}
        minZoom={0.3}
        maxZoom={1.5}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!bg-card !border-border !rounded-xl" />
        <MiniMap
          className="!bg-card/80 !border-border !rounded-xl"
          nodeColor={(node) =>
            node.id === project.rootMenuId
              ? 'hsl(145 65% 45%)'
              : 'hsl(200 100% 40%)'
          }
          maskColor="hsl(var(--background) / 0.8)"
          zoomable={false}
          pannable={false}
        />
      </ReactFlow>

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/projects')}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </Button>
          <div className="glass-panel px-4 py-2">
            <h1 className="text-sm font-semibold text-foreground">
              {project.name}
            </h1>
          </div>
          {/* Auto-save indicator */}
          <div className="glass-panel px-3 py-2 flex items-center gap-2">
            {!isOnline && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs text-destructive">Офлайн</span>
              </>
            )}
            {isOnline && saveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Сохранение...</span>
              </>
            )}
            {isOnline && saveStatus === 'saved' && (
              <>
                <Cloud className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-500">Сохранено</span>
              </>
            )}
            {isOnline && saveStatus === 'idle' && lastSaved && (
              <>
                <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
            {isOnline && saveStatus === 'idle' && !lastSaved && (
              <>
                <CloudOff className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/50">Авто</span>
              </>
            )}
            <button
              onClick={forceSave}
              disabled={saveStatus === 'saving'}
              className="ml-1 p-1 rounded hover:bg-muted/50 transition-colors disabled:opacity-50"
              title="Сохранить сейчас"
            >
              <Save className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              className="h-8 w-8"
              title="Отменить (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              className="h-8 w-8"
              title="Повторить (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Ещё
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={saveToCloud} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4 mr-2" />
                )}
                Сохранить в Cloud
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleAutoLayout}>
                <LayoutGrid className="w-4 h-4 mr-2" />
                Авто-раскладка
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowProductCatalog(true)}>
                <Package className="w-4 h-4 mr-2" />
                Каталог товаров
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPurchase(true)}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Получить код
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowTelegram(true)}>
                <Bot className="w-4 h-4 mr-2" />
                Подключить Telegram
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (showPreview) {
                setPreviewMenuId(null);
                setPreviewHistory([]);
              }
              setShowPreview(!showPreview);
            }}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            Превью
          </Button>
          <Button
            size="sm"
            className="gap-2 telegram-button"
            onClick={() => setShowTelegram(true)}
          >
            <Play className="w-4 h-4" />
            Тест
          </Button>
        </div>
      </div>

      {/* FAB - Add Menu or Action */}
      <FabMenu onAddMenu={handleAddMenu} onAddAction={handleAddActionNode} />

      {/* Menu Editor Panel */}
      <AnimatePresence>
        {showEditor && currentMenu && (
          <MenuEditor
            menu={currentMenu}
            allMenus={project.menus}
            onClose={() => setShowEditor(false)}
          />
        )}
      </AnimatePresence>

      {/* Action Node Editor Panel */}
      <AnimatePresence>
        {showActionEditor && selectedActionNode && (
          <ActionNodeEditor
            actionNode={selectedActionNode}
            menus={project.menus}
            onClose={() => {
              setShowActionEditor(false);
              setSelectedActionNode(null);
            }}
            onDelete={() => {
              setShowActionEditor(false);
              setActionNodeToDelete({ id: selectedActionNode.id, name: ACTION_INFO[selectedActionNode.type]?.name || 'Действие' });
            }}
          />
        )}
      </AnimatePresence>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute top-20 right-4 z-40"
          >
            <PhoneFrame scale={0.85}>
              <BotPreview
                menu={previewMenu}
                menus={project.menus}
                actionNodes={project.actionNodes || []}
                botName={project.name}
                onButtonClick={handlePreviewNavigate}
                onNavigateToMenu={(menuId) => {
                  if (previewMenu) setPreviewHistory(prev => [...prev, previewMenu.id]);
                  setPreviewMenuId(menuId);
                }}
                onBack={handlePreviewBack}
                canGoBack={previewHistory.length > 0}
              />
            </PhoneFrame>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ExportImportModal
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
      />
      <PurchaseRequestModal
        isOpen={showPurchase}
        onClose={() => setShowPurchase(false)}
      />
      <TelegramConnectModal
        isOpen={showTelegram}
        onClose={() => setShowTelegram(false)}
      />
      <ProductCatalogModal
        projectId={project.id}
        isOpen={showProductCatalog}
        onClose={() => setShowProductCatalog(false)}
      />

      {/* Delete Edge Confirmation */}
      <AlertDialog open={!!edgeToDelete} onOpenChange={(open) => !open && setEdgeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-destructive" />
              Удалить связь?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить связь кнопки "{edgeToDelete?.buttonText}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConnection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Menu Confirmation */}
      <AlertDialog open={!!menuToDelete} onOpenChange={(open) => !open && setMenuToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Удалить меню?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить меню "{menuToDelete?.menuName}"? Все кнопки и связи этого меню будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (menuToDelete) {
                  deleteMenu(menuToDelete.menuId);
                  setNodesKey((k) => k + 1);
                  setMenuToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Action Node Confirmation */}
      <AlertDialog open={!!actionNodeToDelete} onOpenChange={(open) => !open && setActionNodeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Удалить действие?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить действие "{actionNodeToDelete?.name}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionNodeToDelete) {
                  deleteActionNode(actionNodeToDelete.id);
                  setNodesKey((k) => k + 1);
                  setActionNodeToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
