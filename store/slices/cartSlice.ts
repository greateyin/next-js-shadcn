import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Prisma } from '@prisma/client';

/**
 * Converts a value that could be either a number or Prisma.Decimal to a number.
 * 
 * @param value - The value to convert
 * @returns The value as a number
 */
const toNumber = (value: number | Prisma.Decimal): number => {
    return value instanceof Prisma.Decimal ? value.toNumber() : value;
};

/**
 * Represents an item in the shopping cart.
 */
export interface CartItem {
    id: number;
    name: string;
    price: number | Prisma.Decimal;
    quantity: number;
}

/**
 * Represents the state of the shopping cart.
 */
interface CartState {
    items: CartItem[];
}

/**
 * Initial state for the cart slice.
 */
const initialState: CartState = {
    items: [],
};

/**
 * Redux slice for managing the shopping cart state.
 */
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        /**
         * Adds an item to the cart or increases its quantity if it already exists.
         */
        addItem: (state, action: PayloadAction<CartItem>) => {
            const newItem = {
                ...action.payload,
                price: toNumber(action.payload.price)
            };
            const existingItem = state.items.find(item => item.id === newItem.id);
            if (existingItem) {
                existingItem.quantity += newItem.quantity;
            } else {
                state.items.push(newItem);
            }
        },

        /**
         * Removes an item from the cart based on its ID.
         */
        removeItem: (state, action: PayloadAction<number>) => {
            state.items = state.items.filter(item => item.id !== action.payload);
        },

        /**
         * Updates the quantity of a specific item in the cart.
         */
        updateItemQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
            const item = state.items.find(item => item.id === action.payload.id);
            if (item) {
                item.quantity = action.payload.quantity;
            }
        },

        /**
         * Clears all items from the cart.
         */
        clearCart: (state) => {
            state.items = [];
        },
    },
});

export const { addItem, removeItem, updateItemQuantity, clearCart } = cartSlice.actions;

/**
 * Selector for calculating the total value of items in the cart.
 */
export const selectCartTotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((total, item) => total + toNumber(item.price) * item.quantity, 0);

export default cartSlice.reducer;