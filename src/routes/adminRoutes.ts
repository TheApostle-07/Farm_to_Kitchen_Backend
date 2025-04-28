/* ──────────────────────────────────────────────────────────
   src/routes/adminRoutes.ts
   All routes are protected by: verifyFirebaseToken ➜ isAdmin
   ────────────────────────────────────────────────────────── */

   import { Router } from 'express';
   import { verifyFirebaseToken } from '../middlewares/auth';
   import { isAdmin }            from '../middlewares/isAdmin';
   import { User }               from '../models/User';
   import { Product }            from '../models/Product';
   import { Order }              from '../models/Order';
   
   const router = Router();
   
   // Reusable guard ------------------------------------------------------------
   const protectAdmin = [verifyFirebaseToken, isAdmin];
   
   // Helpers -------------------------------------------------------------------
   const intSafe = (v: any, d = 1) => {
     const n = parseInt(v as string, 10);
     return Number.isNaN(n) || n <= 0 ? d : n;
   };
   
   // ────────────────────────────────────────────────────────────────────────────
   // USERS
   // ────────────────────────────────────────────────────────────────────────────
   
   // GET /api/admin/users?role=
   router.get('/users', protectAdmin, async (req, res) => {
     const { role } = req.query;
     const filter   = role ? { role } : {};
     const users    = await User.find(filter).sort({ createdAt: -1 });
     res.json(users);
   });
   
   // PATCH /api/admin/user/:id
   router.patch('/user/:id', protectAdmin, async (req, res) => {
     const { id }   = req.params;
     const { role } = req.body;
   
     const user = await User.findById(id);
     if (!user) return res.status(404).json({ error: 'User not found' });
   
     if (role) user.role = role;
     await user.save();
   
     res.json({ message: 'User updated', user });
   });
   
   // ────────────────────────────────────────────────────────────────────────────
   // PRODUCTS
   // ────────────────────────────────────────────────────────────────────────────
   
   // GET /api/admin/products?page=&limit=&q=
   router.get('/products', protectAdmin, async (req, res) => {
     const page  = intSafe(req.query.page, 1);
     const limit = intSafe(req.query.limit, 10);
     const q     = (req.query.q as string || '').trim();
   
     const filter: any = q
       ? { name: { $regex: q, $options: 'i' } }
       : {};
   
     const total  = await Product.countDocuments(filter);
     const items  = await Product.find(filter)
                       .populate('farmerId', 'name email')
                       .sort({ createdAt: -1 })
                       .skip((page - 1) * limit)
                       .limit(limit);
   
     res.json({ total, items });
   });
   
   // DELETE /api/admin/products/:id  (hard delete)
   router.delete('/products/:id', protectAdmin, async (req, res) => {
     const product = await Product.findByIdAndDelete(req.params.id);
     if (!product) return res.status(404).json({ error: 'Product not found' });
     res.json({ message: 'Product deleted', product });
   });
   
   // ────────────────────────────────────────────────────────────────────────────
   // ORDERS
   // ────────────────────────────────────────────────────────────────────────────
   
   // GET /api/admin/orders?page=&limit=&q=&status=
   router.get('/orders', protectAdmin, async (req, res) => {
     const page   = intSafe(req.query.page, 1);
     const limit  = intSafe(req.query.limit, 10);
     const q      = (req.query.q as string || '').trim();
     const status = (req.query.status as string || '').toUpperCase();
   
     const filter: any = {};
     if (status && status !== 'ALL') filter.status = status;
     if (q) {
       filter.$or = [
         { _id:              { $regex: q, $options: 'i' } },
         { 'consumerId.name':  { $regex: q, $options: 'i' } },
         { 'consumerId.email': { $regex: q, $options: 'i' } },
       ];
     }
   
     const total = await Order.countDocuments(filter);
     const items = await Order.find(filter)
           .populate('consumerId', 'name email')
           .populate('items.productId', 'name')
           .sort({ createdAt: -1 })
           .skip((page - 1) * limit)
           .limit(limit);
   
     res.json({ total, items });
   });
   
   // PATCH /api/admin/orders/:id/status  { status }
   router.patch('/orders/:id/status', protectAdmin, async (req, res) => {
     const { status } = req.body;
     const allowed    = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
   
     if (!allowed.includes(status))
       return res.status(400).json({ error: 'Invalid status value' });
   
     const order = await Order.findById(req.params.id);
     if (!order) return res.status(404).json({ error: 'Order not found' });
   
     order.status = status;
     await order.save();
   
     res.json({ message: 'Order status updated', order });
   });









   
   // DELETE /api/admin/orders/:id
   router.delete('/orders/:id', protectAdmin, async (req, res) => {
     const order = await Order.findByIdAndDelete(req.params.id);
     if (!order) return res.status(404).json({ error: 'Order not found' });
     res.json({ message: 'Order deleted', order });
   });




   // src/routes/adminRoutes.ts  (only the /stats handler shown)

   router.get('/stats', protectAdmin, async (_req, res) => {
    const [
      totalUsers,
      totalAdmins,
      totalFarmers,
      totalProducts,
      totalOrders,
      revenueAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'ADMIN' }),
      User.countDocuments({ role: 'FARMER' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: ['PAID', 'DELIVERED'] } } },
        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
      ])
    ]);
  
    const totalRevenue  = revenueAgg[0]?.sum ?? 0;
    const totalConsumers = totalUsers - totalFarmers - totalAdmins;
  
    res.json({
      totalUsers,
      totalAdmins,
      totalFarmers,
      totalConsumers,
      totalProducts,
      totalOrders,
      totalRevenue            // ← now defined
    });
  });


  router.get('/analytics', protectAdmin, async (_req, res) => {
    const [
      totalUsers,
      totalAdmins,
      totalFarmers,
      totalProducts,
      totalOrders,
      revenueAgg,
      ordersAgg,
      topProdAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'ADMIN' }),
      User.countDocuments({ role: 'FARMER' }),
      Product.countDocuments(),
      Order.countDocuments(),
      // total revenue
      Order.aggregate([
        { $match: { status: { $in: ['PAID','DELIVERED'] } } },
        { $group: { _id: null, sum: { $sum: '$totalAmount' } } }
      ]),
      // orders per day last 30 days
      ((): any =>
        Order.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 29 * 24*60*60*1000)
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', count: 1, _id: 0 } }
        ])
      )(),
      // top 5 best-selling products
      ((): any =>
        Order.aggregate([
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              sold: { $sum: '$items.qty' }
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: '_id',
              foreignField: '_id',
              as: 'product'
            }
          },
          { $unwind: '$product' },
          {
            $project: {
              _id: 0,
              name: '$product.name',
              sold: 1
            }
          },
          { $sort: { sold: -1 } },
          { $limit: 5 }
        ])
      )()
    ]);
  
    const totalRevenue   = revenueAgg[0]?.sum   ?? 0;
    const totalConsumers = totalUsers - totalAdmins - totalFarmers;
  
    res.json({
      totals: {
        users:     totalUsers,
        admins:    totalAdmins,
        farmers:   totalFarmers,
        consumers: totalConsumers,
        products:  totalProducts,
        orders:    totalOrders,
        revenue:   totalRevenue
      },
      ordersLast30: ordersAgg,
      topProducts:  topProdAgg
    });
  });
   
   export default router;