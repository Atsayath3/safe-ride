import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BudgetLimit, MonthlyExpense } from '../interfaces/personalization';

export class BudgetTrackingService {
  
  // Create budget limit for a child
  static async createBudgetLimit(budgetData: Omit<BudgetLimit, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'budgetLimits'), {
        ...budgetData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating budget limit:', error);
      throw error;
    }
  }

  // Get budget limits for parent's children
  static async getBudgetLimits(parentId: string): Promise<BudgetLimit[]> {
    try {
      const q = query(
        collection(db, 'budgetLimits'),
        where('parentId', '==', parentId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as BudgetLimit));
    } catch (error) {
      console.error('Error fetching budget limits:', error);
      throw error;
    }
  }

  // Get budget limit for specific child
  static async getBudgetLimitForChild(childId: string): Promise<BudgetLimit | null> {
    try {
      const q = query(
        collection(db, 'budgetLimits'),
        where('childId', '==', childId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      } as BudgetLimit;
    } catch (error) {
      console.error('Error fetching budget limit for child:', error);
      return null;
    }
  }

  // Update budget limit
  static async updateBudgetLimit(budgetId: string, updates: Partial<BudgetLimit>): Promise<void> {
    try {
      const budgetRef = doc(db, 'budgetLimits', budgetId);
      await updateDoc(budgetRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating budget limit:', error);
      throw error;
    }
  }

  // Add expense and update budget
  static async addExpense(childId: string, rideId: string, amount: number, driverName: string, route: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-09"
      
      // Get or create monthly expense record
      const monthlyExpenseRef = await this.getOrCreateMonthlyExpense(childId, currentMonth);
      
      // Update monthly expense
      const monthlyExpenseDoc = await getDoc(monthlyExpenseRef);
      const currentData = monthlyExpenseDoc.data() as MonthlyExpense;
      
      const newExpense = {
        rideId,
        amount,
        date: new Date(),
        driverName,
        route
      };
      
      const updatedExpenses = [...(currentData.expenses || []), newExpense];
      const newTotalAmount = currentData.totalAmount + amount;
      const newRideCount = currentData.rideCount + 1;
      
      batch.update(monthlyExpenseRef, {
        totalAmount: newTotalAmount,
        rideCount: newRideCount,
        averageCostPerRide: newTotalAmount / newRideCount,
        expenses: updatedExpenses,
        updatedAt: Timestamp.now()
      });
      
      // Update budget limit current spent
      const budgetLimit = await this.getBudgetLimitForChild(childId);
      if (budgetLimit) {
        const budgetRef = doc(db, 'budgetLimits', budgetLimit.id);
        batch.update(budgetRef, {
          currentSpent: newTotalAmount,
          updatedAt: Timestamp.now()
        });
        
        // Check if warning or limit reached
        await this.checkBudgetThresholds(budgetLimit, newTotalAmount);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  // Get or create monthly expense record
  private static async getOrCreateMonthlyExpense(childId: string, month: string) {
    const q = query(
      collection(db, 'monthlyExpenses'),
      where('childId', '==', childId),
      where('month', '==', month)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return doc(db, 'monthlyExpenses', snapshot.docs[0].id);
    }
    
    // Create new monthly expense record
    const child = await getDoc(doc(db, 'children', childId));
    const childData = child.data();
    
    const newExpenseData = {
      childId,
      parentId: childData?.parentId || '',
      month,
      totalAmount: 0,
      rideCount: 0,
      averageCostPerRide: 0,
      expenses: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'monthlyExpenses'), newExpenseData);
    return docRef;
  }

  // Get monthly expenses for a child
  static async getMonthlyExpenses(childId: string, months: number = 6): Promise<MonthlyExpense[]> {
    try {
      const q = query(
        collection(db, 'monthlyExpenses'),
        where('childId', '==', childId),
        orderBy('month', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expenses: doc.data().expenses.map((exp: any) => ({
          ...exp,
          date: exp.date.toDate()
        }))
      } as MonthlyExpense));
      
      return expenses.slice(0, months);
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      throw error;
    }
  }

  // Get all monthly expenses for parent
  static async getAllMonthlyExpenses(parentId: string, month?: string): Promise<MonthlyExpense[]> {
    try {
      let q = query(
        collection(db, 'monthlyExpenses'),
        where('parentId', '==', parentId),
        orderBy('month', 'desc')
      );
      
      if (month) {
        q = query(q, where('month', '==', month));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expenses: doc.data().expenses.map((exp: any) => ({
          ...exp,
          date: exp.date.toDate()
        }))
      } as MonthlyExpense));
    } catch (error) {
      console.error('Error fetching all monthly expenses:', error);
      throw error;
    }
  }

  // Check budget thresholds and send notifications
  private static async checkBudgetThresholds(budgetLimit: BudgetLimit, currentSpent: number): Promise<void> {
    const percentageUsed = (currentSpent / budgetLimit.monthlyLimit) * 100;
    
    // Warning threshold reached
    if (percentageUsed >= budgetLimit.warningThreshold && budgetLimit.notifications.warningEnabled) {
      await this.sendBudgetNotification(budgetLimit.parentId, 'warning', {
        childId: budgetLimit.childId,
        percentageUsed: Math.round(percentageUsed),
        currentSpent,
        monthlyLimit: budgetLimit.monthlyLimit,
        remaining: budgetLimit.monthlyLimit - currentSpent
      });
    }
    
    // Limit reached
    if (percentageUsed >= 100 && budgetLimit.notifications.limitReachedEnabled) {
      await this.sendBudgetNotification(budgetLimit.parentId, 'limit_reached', {
        childId: budgetLimit.childId,
        currentSpent,
        monthlyLimit: budgetLimit.monthlyLimit,
        overspent: currentSpent - budgetLimit.monthlyLimit
      });
    }
  }

  // Send budget notification (integrate with your notification system)
  private static async sendBudgetNotification(parentId: string, type: 'warning' | 'limit_reached', data: any): Promise<void> {
    try {
      // Add notification to notifications collection
      await addDoc(collection(db, 'notifications'), {
        parentId,
        type: 'budget_alert',
        subType: type,
        title: type === 'warning' ? 'Budget Warning' : 'Budget Limit Reached',
        message: type === 'warning' 
          ? `Your child's monthly transport budget is ${data.percentageUsed}% used (LKR ${data.currentSpent}/${data.monthlyLimit})`
          : `Your child's monthly transport budget limit has been exceeded by LKR ${data.overspent}`,
        data,
        isRead: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error sending budget notification:', error);
    }
  }

  // Reset monthly budgets (call this monthly via cron job)
  static async resetMonthlyBudgets(): Promise<void> {
    try {
      const q = query(
        collection(db, 'budgetLimits'),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(document => {
        batch.update(document.ref, {
          currentSpent: 0,
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error resetting monthly budgets:', error);
      throw error;
    }
  }

  // Get budget summary for parent dashboard
  static async getBudgetSummary(parentId: string): Promise<{
    totalMonthlyLimit: number;
    totalCurrentSpent: number;
    childrenBudgets: {
      childId: string;
      childName: string;
      monthlyLimit: number;
      currentSpent: number;
      percentageUsed: number;
      status: 'safe' | 'warning' | 'exceeded';
    }[];
  }> {
    try {
      const budgetLimits = await this.getBudgetLimits(parentId);
      let totalMonthlyLimit = 0;
      let totalCurrentSpent = 0;
      
      const childrenBudgets = await Promise.all(
        budgetLimits.map(async (budget) => {
          const child = await getDoc(doc(db, 'children', budget.childId));
          const childName = child.data()?.name || 'Unknown';
          
          totalMonthlyLimit += budget.monthlyLimit;
          totalCurrentSpent += budget.currentSpent;
          
          const percentageUsed = (budget.currentSpent / budget.monthlyLimit) * 100;
          let status: 'safe' | 'warning' | 'exceeded' = 'safe';
          
          if (percentageUsed >= 100) status = 'exceeded';
          else if (percentageUsed >= budget.warningThreshold) status = 'warning';
          
          return {
            childId: budget.childId,
            childName,
            monthlyLimit: budget.monthlyLimit,
            currentSpent: budget.currentSpent,
            percentageUsed: Math.round(percentageUsed),
            status
          };
        })
      );
      
      return {
        totalMonthlyLimit,
        totalCurrentSpent,
        childrenBudgets
      };
    } catch (error) {
      console.error('Error getting budget summary:', error);
      throw error;
    }
  }
}