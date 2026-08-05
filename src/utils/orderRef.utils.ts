import { Order } from '../models';

export const generateOrderRef = async (): Promise<string> => {
  let isUnique = false;
  let ref = '';

  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    ref = `TK-${randomNum}`;

    const existing = await Order.findOne({ where: { orderRef: ref } });
    if (!existing) {
      isUnique = true;
    }
  }

  return ref;
};
