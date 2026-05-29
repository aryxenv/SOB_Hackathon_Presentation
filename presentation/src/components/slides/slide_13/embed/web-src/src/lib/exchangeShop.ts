export interface ExchangeRewardItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  pointsCost: number;
  categoryKey: string;
}

export const EXCHANGE_REWARDS: ExchangeRewardItem[] = [
  {
    id: 'meet-athlete',
    titleKey: 'shop.item.meetAthlete.title',
    descriptionKey: 'shop.item.meetAthlete.desc',
    pointsCost: 1400,
    categoryKey: 'shop.category.experience',
  },
  {
    id: 'free-ticket',
    titleKey: 'shop.item.freeTicket.title',
    descriptionKey: 'shop.item.freeTicket.desc',
    pointsCost: 900,
    categoryKey: 'shop.category.event',
  },
  {
    id: 'sob-tshirt',
    titleKey: 'shop.item.tshirt.title',
    descriptionKey: 'shop.item.tshirt.desc',
    pointsCost: 700,
    categoryKey: 'shop.category.merch',
  },
  {
    id: 'signed-tshirt',
    titleKey: 'shop.item.signedTshirt.title',
    descriptionKey: 'shop.item.signedTshirt.desc',
    pointsCost: 1200,
    categoryKey: 'shop.category.merch',
  },
  {
    id: 'sob-cap',
    titleKey: 'shop.item.cap.title',
    descriptionKey: 'shop.item.cap.desc',
    pointsCost: 500,
    categoryKey: 'shop.category.merch',
  },
  {
    id: 'sticker-pack',
    titleKey: 'shop.item.stickers.title',
    descriptionKey: 'shop.item.stickers.desc',
    pointsCost: 250,
    categoryKey: 'shop.category.merch',
  },
];
