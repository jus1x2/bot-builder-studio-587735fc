import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Package, Save, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  image_url: string | null;
  sku: string | null;
  stock: number | null;
  max_quantity: number | null;
  variants: string[] | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ProductCatalogModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductCatalogModal({ projectId, isOpen, onClose }: ProductCatalogModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, projectId]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bot_products')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Ошибка загрузки каталога');
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    if (!editingProduct) return;
    
    setSaving(true);
    try {
      if (editingProduct.id) {
        // Update existing
        const { error } = await supabase
          .from('bot_products')
          .update({
            name: editingProduct.name,
            description: editingProduct.description,
            price: editingProduct.price || 0,
            old_price: editingProduct.old_price,
            image_url: editingProduct.image_url,
            sku: editingProduct.sku,
            stock: editingProduct.stock,
            max_quantity: editingProduct.max_quantity || 10,
            variants: editingProduct.variants || [],
            category: editingProduct.category,
            is_active: editingProduct.is_active ?? true,
          })
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        toast.success('Товар обновлён');
      } else {
        // Create new
        const { error } = await supabase
          .from('bot_products')
          .insert({
            project_id: projectId,
            name: editingProduct.name || 'Новый товар',
            description: editingProduct.description,
            price: editingProduct.price || 0,
            old_price: editingProduct.old_price,
            image_url: editingProduct.image_url,
            sku: editingProduct.sku,
            stock: editingProduct.stock,
            max_quantity: editingProduct.max_quantity || 10,
            variants: editingProduct.variants || [],
            category: editingProduct.category,
            is_active: editingProduct.is_active ?? true,
            sort_order: products.length,
          });
        
        if (error) throw error;
        toast.success('Товар добавлен');
      }
      
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bot_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Товар удалён');
      loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Ошибка удаления');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Каталог товаров</h2>
                <p className="text-xs text-muted-foreground">{products.length} товаров</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setEditingProduct({ is_active: true })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить товар
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Product list */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Каталог пуст</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Добавьте первый товар</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border bg-background hover:bg-muted/50 transition-colors cursor-pointer ${
                        editingProduct?.id === product.id ? 'ring-2 ring-primary' : ''
                      } ${!product.is_active ? 'opacity-50' : ''}`}
                      onClick={() => setEditingProduct(product)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                      
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-emerald-600">
                            {Number(product.price).toLocaleString('ru-RU')} ₽
                          </span>
                          {product.old_price && (
                            <span className="text-muted-foreground line-through text-xs">
                              {Number(product.old_price).toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                          {product.sku && (
                            <span className="text-muted-foreground text-xs">• {product.sku}</span>
                          )}
                        </div>
                      </div>
                      
                      {product.stock !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                        }`}>
                          {product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProduct(product.id); }}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Edit panel */}
            {editingProduct && (
              <div className="w-80 border-l p-4 overflow-y-auto">
                <h3 className="font-medium mb-4">
                  {editingProduct.id ? 'Редактирование' : 'Новый товар'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Название *</label>
                    <Input
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="Название товара"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Описание</label>
                    <Textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      placeholder="Описание товара"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Цена *</label>
                      <Input
                        type="number"
                        min={0}
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Старая цена</label>
                      <Input
                        type="number"
                        min={0}
                        value={editingProduct.old_price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, old_price: e.target.value ? Number(e.target.value) : null })}
                        placeholder="—"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Фото (URL)</label>
                    <Input
                      value={editingProduct.image_url || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                    {editingProduct.image_url && (
                      <img 
                        src={editingProduct.image_url} 
                        alt="" 
                        className="w-full h-24 object-cover rounded-lg mt-2"
                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Артикул</label>
                      <Input
                        value={editingProduct.sku || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                        placeholder="SKU-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Остаток</label>
                      <Input
                        type="number"
                        min={0}
                        value={editingProduct.stock ?? ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value ? Number(e.target.value) : null })}
                        placeholder="∞"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Категория</label>
                    <Input
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      placeholder="Одежда"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm">Активен</label>
                    <Switch
                      checked={editingProduct.is_active ?? true}
                      onCheckedChange={(checked) => setEditingProduct({ ...editingProduct, is_active: checked })}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingProduct(null)}
                    >
                      Отмена
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={saveProduct}
                      disabled={saving || !editingProduct.name}
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Сохранить
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}