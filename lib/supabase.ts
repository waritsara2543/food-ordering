import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface MenuItem {
  id: string
  name: string
  price: number
  image: string
  category: "drinks" | "food"
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  total: number
  payment_slip?: string
  payment_status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  menu_item_name: string
  menu_item_price: number
  quantity: number
  created_at?: string
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

// Menu Items API
export const menuItemsApi = {
  async getAll(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error
    return data || []
  },

  async create(item: Omit<MenuItem, "id" | "created_at" | "updated_at">): Promise<MenuItem> {
    const { data, error } = await supabase.from("menu_items").insert([item]).select().single()

    if (error) throw error
    return data
  },

  async update(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from("menu_items")
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("menu_items").delete().eq("id", id)

    if (error) throw error
  },
}

// Orders API
export const ordersApi = {
  async getAll(): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async getTodayOrders(): Promise<OrderWithItems[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(orderData: {
    customer_name: string
    customer_phone: string
    total: number
    payment_slip?: string
    items: Array<{
      menu_item_id: string
      menu_item_name: string
      menu_item_price: number
      quantity: number
    }>
  }): Promise<OrderWithItems> {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          total: orderData.total,
          payment_slip: orderData.payment_slip,
          payment_status: "pending",
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    const orderItems = orderData.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      menu_item_name: item.menu_item_name,
      menu_item_price: item.menu_item_price,
      quantity: item.quantity,
    }))

    const { data: items, error: itemsError } = await supabase.from("order_items").insert(orderItems).select()

    if (itemsError) throw itemsError

    return {
      ...order,
      order_items: items,
    }
  },

  async updatePaymentStatus(id: string, status: "pending" | "approved" | "rejected"): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .update({
        payment_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  },
}
