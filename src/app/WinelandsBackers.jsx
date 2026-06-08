'use client';
import { useState, useEffect, useRef } from 'react';

// ─── PALETTE & TOKENS (Winelands Art Gallery brand) ─────────────────
const C = {
  ink: '#1a2744',
  inkMid: '#162038',
  cream: '#e8edf5',
  creamDark: '#c4cedd',
  gold: '#c9a84c',
  goldLight: '#dfc06a',
  goldDim: 'rgba(201,168,76,0.15)',
  goldBorder: 'rgba(201,168,76,0.25)',
  goldGlow: 'rgba(201,168,76,0.07)',
  mist: '#4a5878',
  fog: '#8a9bb8',
  white: '#ffffff',
  green: '#5aaa7a',
  greenDim: 'rgba(90,170,122,0.15)',
  red: '#b04040',
};

const fmt = n => Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = n => Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── ARTIST DATA (26 artists · 525 works · live from thewinelandsartgallery.com)
const ARTISTS = [
  {
    id: `solly-manthata`,
    name: `Solly Manthata`,
    born: 1962,
    birthplace: `Germiston`,
    medium: `Oil & Acrylic`,
    style: `Landscapes, Bo-Kaap, Seascapes`,
    bio: `Solly Manthata: The Winelands Art Gallery's Colorful Maestro

On the 31st of May in 1962, in the heart of Germiston, Solly Manthata took his first breath, cradled in the embrace of humble beginnings. His mother, a diligent domestic worker from the Eastern Cape, and his father, a mining clerk in Germiston, nurtured the young artist's earliest dreams.

In 1964, as the mines of Germiston closed their gates, the Manthata family embarked on a journey to Carletonville, where Solly, then only two years old, would carve his childhood memories. Alongside his three sisters and a brother, he navigated the dusty streets and pursued his early education in this mining town.

Yet, the year 1976 brought unrest to South Africa, and Solly's father decided to seek safer shores for their education, leading them to the tranquil landscapes of Limpopo. Surrounded by nature's splendor, Solly's affinity for art flourished, a passion that had taken root as early as age nine.

After completing his matriculation, Solly entered the mining industry, where he spent 22 dedicated years in the Human Resources department. Eventually, he ventured to Rustenburg to work for a new company. But deep within him, the call of his artistic spirit grew louder, and he decided it was time to heed its summons.

Solly Manthata, the first exclusive artist to grace the hallowed halls of The Winelands Art Gallery, embarked on a full-time artistic journey. His creations are a vivid tapestry, a symphony of colors that dance upon his canvas, with a particular fondness for painting the colorful farm landscapes that grace southern Africa.

With no formal art training, Solly's gift is a divine endowment, an unspoken poetry of colors and images. He draws inspiration from the great South African masters of old, such as Adriaan Boshoff, Errol Boyle, Chris Tugwell, George Pemba, and Gerard Sekoto. In his words, "Visual art is silent poetry of colors and images," a testament to the profound storytelling woven into each of his works.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/1_b7f9f56f-a290-4c16-a6fb-f77614888956.png?v=1757589820`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/solly-manthata-1`,
    works: [
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 14750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0526002_1.png?v=1779871044`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 14750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0526001_1.png?v=1779870935`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06240071_be73068b-828c-46f2-875b-a975c0750fdc.png?v=1779262670`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1600mm x 600mm`,
        price: 14700.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM03260011.png?v=1773756732`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09250011.png?v=1768818751`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1070mm x 800mm`,
        price: 9690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260061_674b917f-4076-437b-a136-8282f305e1a1.png?v=1774510172`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260051.png?v=1768818666`,
        status: `available`
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260041.png?v=1768818603`,
        status: `available`
      },
      {
        title: `Solly Manthata - 730mm x 730mm`,
        price: 9750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260031.png?v=1768818450`,
        status: `available`
      },
      {
        title: `Solly Manthata - 940mm x 350mm`,
        price: 5850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260021.png?v=1768818401`,
        status: `available`
      },
      {
        title: `Solly Manthata - 900mm x 330mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260011.png?v=1768818257`,
        status: `available`
      },
      {
        title: `Solly Manthata - Triptych (3 in 1 ) Oil & Acrylic on Stretched Canvas (400mm x 300mm each)`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/xSM1225001_1_61379b31-5cd1-4ede-9294-81ac409d2b5f.png?v=1765456252`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225013_1.png?v=1765455843`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225012_1_65ca8ecc-5b40-423e-bba8-a0eef2604d56.png?v=1765455802`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225011_1.png?v=1765455695`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225010_1.png?v=1765455641`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225009_1.png?v=1765455593`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225008_1.png?v=1765455544`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225007_1_37d47d14-986b-4e32-84b5-b1f90b26f75c.png?v=1765455469`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225006_1.png?v=1765455387`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225005_1.png?v=1765455335`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225004_1.png?v=1765455294`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225003_1.png?v=1765455134`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (400mm x 300mm)`,
        price: 4150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1225002_1.png?v=1765455015`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (1600mm x 600mm)`,
        price: 14700.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09250041.png?v=1758528782`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (1600mm x 600mm)`,
        price: 10290.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09250031.png?v=1758528748`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas (1600mm x 600mm)`,
        price: 14700.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09250021.png?v=1758528665`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 600mm) with Reverse side "doodle"`,
        price: 8450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM08250071.png?v=1756729649`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 600mm)`,
        price: 6950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM08250061.png?v=1756729579`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM08250051.png?v=1756729478`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM12230021.png?v=1756729418`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230121.png?v=1756729380`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM10230031.png?v=1756729332`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06240071_cfdf8a44-87fe-48de-b378-977b91f7878e.png?v=1756729293`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM03250011.png?v=1756729102`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1050mm x 800mm)`,
        price: 11990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM08250041.png?v=1756201847`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM08250031_33ef27f5-15d6-4c37-a1c0-6f6b426f67e4.png?v=1756201773`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0825002.png?v=1756201695`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 8900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0825001.png?v=1756201637`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM05250041.png?v=1752155861`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 630mm)`,
        price: 6950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06250051.png?v=1751281607`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 630mm)`,
        price: 6950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06250041.png?v=1751281558`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06250031.png?v=1751281479`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06250021.png?v=1749808756`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM06250011.png?v=1749808715`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM05250031.png?v=1749808665`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Canvas (1500mm x 500mm)`,
        price: 11750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0225003.png?v=1739878715`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Canvas (1500mm x 500mm)`,
        price: 11750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0225002.png?v=1739878661`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Canvas (1500mm x 500mm)`,
        price: 11750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0225001.png?v=1739878598`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 650mm)`,
        price: 5950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125018.png?v=1739878464`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 650mm)`,
        price: 5950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125008.png?v=1739878425`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 650mm)`,
        price: 5950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125007.png?v=1739878342`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1124006.png?v=1739878264`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (800mm x 650mm)`,
        price: 11990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1124005.png?v=1739878114`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1124002.png?v=1739878061`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1124001.png?v=1739877989`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01250151.png?v=1739877923`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125014.png?v=1739877868`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125013.png?v=1739877826`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125012.png?v=1739877785`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125011.png?v=1739877675`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125010.png?v=1739877618`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125006.png?v=1739877548`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125005.png?v=1739877498`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0125001.png?v=1739877372`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1024004a.png?v=1728911887`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1024002a.png?v=1728911854`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1024001a.png?v=1728911814`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1024005a.png?v=1728898234`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1024003a.png?v=1728898176`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1000mm x 800mm)`,
        price: 11750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0924011a.png?v=1728898062`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0924010a.png?v=1728898014`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0924009a.png?v=1728897974`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (1200mm x 800mm)`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0924008a.png?v=1728897913`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel (650mm x 340mm)`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0724010a.png?v=1728897724`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM092400211.png?v=1726234128`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM092400111.png?v=1726234082`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 4450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0924006101.png?v=1726233806`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 5950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM07240117.png?v=1726233717`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 12850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09240056.png?v=1726233597`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 11750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09240036.png?v=1726233449`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM082400311.png?v=1726233386`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 11400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0624016a.png?v=1726233218`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 4950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0724009.png?v=1723466165`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0724005.png?v=1723466117`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0724004.png?v=1723466078`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0724003.png?v=1723466031`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0524004.png?v=1716452006`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0524001.png?v=1716451923`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0424006.png?v=1715167425`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0424009.png?v=1715167380`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0424003.png?v=1715167337`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0324002.png?v=1712051146`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 11900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0224008.png?v=1709797749`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0224002.png?v=1708943170`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0124003.png?v=1706263152`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1223007.png?v=1705318137`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1223005.png?v=1705318037`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1223004.png?v=1705317993`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1223001.png?v=1702471660`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas`,
        price: 12500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1123011.png?v=1702040245`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas`,
        price: 12500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230081.png?v=1701237481`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas`,
        price: 12600.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230071.png?v=1701237442`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas`,
        price: 12500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230061.png?v=1701237360`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Stretched Canvas`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230041.png?v=1699602547`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230031.png?v=1699602484`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM11230021.png?v=1699602447`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM10230121.png?v=1698823918`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM10230081.png?v=1698217442`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM10230071.png?v=1698217407`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM10230061.png?v=1698217346`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM1023005.png?v=1697623402`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM10230011.png?v=1696417263`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09230181.png?v=1696417213`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09230171.png?v=1696417136`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09230161.png?v=1696417089`,
        status: `available`
      },
      {
        title: `Solly Manthata - Oil & Acrylic on Panel`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM09230151.png?v=1696417004`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923013copy1.png?v=1696340089`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923011copy1.png?v=1696340050`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923008copy1.png?v=1696339870`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923006copy1.png?v=1696339739`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923005copy1.png?v=1696339428`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 9700.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923004copy1.png?v=1696339659`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923003copy1.png?v=1696339293`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0923001copy1.png?v=1696339208`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 12990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0823113copy1.png?v=1696339118`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM0823111copy1.png?v=1696338965`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 13800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/124.png?v=1694970933`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/120.png?v=1694705120`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/118.png?v=1694704991`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 7900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/116.png?v=1694704649`,
        status: `available`
      },
      {
        title: `Oil & Acrylic on Panel by Solly Manthata`,
        price: 11250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/115.png?v=1694704543`,
        status: `available`
      }
    ]
  },
  {
    id: `paul-van-rensburg`,
    name: `Paul van Rensburg`,
    born: 1963,
    birthplace: `Queenstown, Eastern Cape`,
    medium: `Acrylic`,
    style: `Portraits, Landscapes, Seascapes, Abstract`,
    bio: `Paul van Rensburg: A Journey from the Eastern Cape to Artistic Mastery

Born in the picturesque rural town of Queenstown, Eastern Cape, in 1963, Paul's odyssey through life bears the indelible mark of South Africa's landscape. His formative years saw him at Queen's College, followed by two years of mandated military service.

Paul then found himself drawn to the bustling heartbeat of Johannesburg, where he eventually forged a successful path as the proprietor of an aircraft refurbishing company. However, beneath the veneer of business acumen lay an artist's soul that had been stirring since childhood. Paul's artistic endeavors began as early as age 5, and by 6, he had already committed his first painting to canvas.

Driven by a growing local following, Paul journeyed back to his roots in the Eastern Cape and embarked on a professional artistic career. With a palette as diverse as his creative spirit, he commands oils, acrylics, pastels, charcoal, and more, even venturing into the realm of sculpting.

In pursuit of his craft, Paul eventually found his way to the enchanting shores of Cape Town, Western Cape, South Africa. His art weaves together the stories of his life, etching the landscapes and experiences of a nation onto his canvases, offering viewers a vibrant tapestry of his journey.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/7_4.png?v=1695061520`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/paul-van-rensburg`,
    works: [
      {
        title: `Paul van Rensburg - Exclusive USA Series #1 (1270mm x 1010mm)`,
        price: 74497.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260061.png?v=1773316368`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 16500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260051.png?v=1773316254`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 16500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0126031.png?v=1773316109`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260041.png?v=1773315990`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260031.png?v=1773315939`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260021.png?v=1773315898`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260011.png?v=1773315859`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260351.png?v=1773315805`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260341.png?v=1773315754`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260331.png?v=1773315718`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260321.png?v=1773315619`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 1270mm x 1010mm`,
        price: 34500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260301.png?v=1771592738`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 1270mm x 1010mm`,
        price: 28500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260291.png?v=1771592585`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 1200mm x 600mm`,
        price: 8950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260281.png?v=1771592490`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260221.png?v=1771592388`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260211.png?v=1771592346`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260201_76ec930c-7a0f-4db6-8462-cd26cf3b3704.png?v=1771592303`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260191.png?v=1771592224`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260181.png?v=1771592160`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260171.png?v=1771592093`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 600mm x 420mm`,
        price: 2750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260271.png?v=1771591917`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 600mm x 420mm`,
        price: 2750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260261.png?v=1771591833`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 420mm x 300mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260251.png?v=1771591744`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 420mm x 300mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260241.png?v=1771591669`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 420mm x 300mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260231.png?v=1771591560`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 1200mm x 800mm`,
        price: 13750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260161.png?v=1771502745`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260151.png?v=1771502610`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260141.png?v=1771502558`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260131.png?v=1771502499`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260121.png?v=1771502410`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 1650.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260101.png?v=1771502324`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 1200mm x 800mm`,
        price: 13750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260081.png?v=1768817364`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 900mm x 600mm`,
        price: 4350.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260071.png?v=1768817298`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 600mm x 400mm`,
        price: 1990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260061.png?v=1768817249`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 600mm x 400mm`,
        price: 1990.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260051.png?v=1768817130`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 500mm x 370mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/5_4d01fbab-6e7e-4376-8448-062a017745fc.png?v=1768816161`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 500mm x 370mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/7_129603de-5a39-4b51-94b6-5e23c4b9385c.png?v=1768816096`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 450mm x 350mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/3_92159713-2d15-4376-a620-d82739d17f29.png?v=1768816017`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - 450mm x 350mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/1_6dabd12b-ced9-446e-b50f-48352410143e.png?v=1768815928`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 1000mm)`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024038_1.png?v=1765875918`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched (1800mm x 1600mm)`,
        price: 39500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR12240021.png?v=1757493295`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched (1800mm x 1600mm)`,
        price: 42500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR12240011_02d33fe2-8dbb-4fc6-9a23-526c559b256f.png?v=1757493264`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched (1900mm x 500mm)`,
        price: 18500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR04240031.png?v=1757493075`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR05250041.png?v=1750838276`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR05250031.png?v=1750838206`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1010mm x 760mm`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR06250031.png?v=1749808512`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR06250051.png?v=1749808428`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR06250041.png?v=1749808382`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR05250021.png?v=1747904092`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR05250011.png?v=1747904018`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 18500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR04250181.png?v=1747903934`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1010mm x 760mm`,
        price: 13500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR04250201.png?v=1747903847`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1010mm x 760mm`,
        price: 13500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR04250191.png?v=1747903779`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1010mm x 760mm`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR04250171.png?v=1747903715`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1010mm x 760mm`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR04250161.png?v=1747903329`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1250mm x 1010mm`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425014.png?v=1744871817`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1250mm x 1010mm`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425013.png?v=1744871754`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 16500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425012.png?v=1744871692`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1250mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425011.png?v=1744871630`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1250mm x 1010mm`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0325001.png?v=1744871546`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024033a.png?v=1729592937`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024032a.png?v=1729592881`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024031a.png?v=1729592838`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024030a.png?v=1729592787`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024029a.png?v=1729592700`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024023a.png?v=1729243098`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024022a.png?v=1729243053`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024021a.png?v=1729243005`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (600mm x 400mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024028a.png?v=1729242903`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (600mm x 400mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024027a.png?v=1729242851`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 5850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024016a.png?v=1728987545`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024015a.png?v=1728987512`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024014a.png?v=1728987477`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024013a.png?v=1728987442`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024012a.png?v=1728987403`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (1200mm x 800mm)`,
        price: 14900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0924030.png?v=1728912130`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (1200mm x 800mm)`,
        price: 7450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0924029.png?v=1728912086`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (1200mm x 800mm)`,
        price: 7450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0924027.png?v=1728912001`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024011a.png?v=1728644230`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 5850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024010a.png?v=1728644181`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024009a.png?v=1728644138`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024008a.png?v=1728644105`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas (1200mm x 800mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024007a.png?v=1728643977`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (600mm x 400mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024006a.png?v=1728643805`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (600mm x 400mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024005a.png?v=1728643765`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (600mm x 400mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1024004a.png?v=1728643486`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (1200mm x 800mm)`,
        price: 6450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0924028.png?v=1726580676`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (1200mm x 800mm)`,
        price: 6450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0924032.png?v=1726145468`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel (1200mm x 800mm)`,
        price: 6450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0924031.png?v=1726145388`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel`,
        price: 7950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0824001.png?v=1723465209`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel`,
        price: 4950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0724005.png?v=1723465104`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Panel`,
        price: 4950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0724004.png?v=1723465062`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 9950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0524006.png?v=1723464911`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 28500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0524005.png?v=1723464799`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 28500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0524004.png?v=1723464570`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched (3 in 1 - Triptych)`,
        price: 14700.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR05240031200x600.png?v=1716452446`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR05240021600x1200.png?v=1716452336`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0524001.png?v=1716452110`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 22500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0424001.png?v=1715167078`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 12500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0124006.png?v=1707984451`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0124005.png?v=1707984351`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 4850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0124004.png?v=1707984284`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0124003.png?v=1707984196`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0124001.png?v=1706262988`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1223002.png?v=1702471916`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1223001.png?v=1702471855`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1123007.png?v=1702040482`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1123006.png?v=1701237669`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 28500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1123004.png?v=1701237549`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 22500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1123003.png?v=1700216901`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 22500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1123002.png?v=1700216854`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic & Goldl Leaf on Stretched`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR1123001.png?v=1700216678`,
        status: `available`
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched`,
        price: 12500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR10230021.png?v=1697790915`,
        status: `available`
      }
    ]
  },
  {
    id: `gaynor`,
    name: `Gaynor`,
    born: 1947,
    birthplace: `Cape Town`,
    medium: `Oil`,
    style: `Bo-Kaap, District Six, Kaapse Klopse`,
    bio: `Gaynor: Illuminating the Cape and Beyond

Born in 1947, Gaynor is an accomplished impressionist who predominantly wields oils as her artistic medium. While she may not call the Western Cape home, her oeuvre brilliantly encapsulates the region's rich history, effervescent culture, and picturesque landscapes. Her repertoire includes iconic Cape harbor scenes, evocative District 6 reminiscences, and the vibrant kaleidoscope of Bo Kaap.

However, Gaynor's artistic canvas extends far beyond geographic boundaries. She seamlessly transports viewers to the Mediterranean, infusing her European-themed creations with the enchantment of bustling cafés. Her art, characterized by its charming naivety, speaks a universal language, appealing to a diverse global audience.

With each brushstroke, Gaynor doesn't just depict scenes; she encapsulates emotions and distills the very essence of the places she holds dear. Her art invites a transcendent journey across continents, serving as a testament to the timeless allure of beauty that knows no limitations.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/9_2.png?v=1695060906`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/gaynor`,
    works: [
      {
        title: `Gaynor - (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA03260061.png?v=1774538091`,
        status: `available`
      },
      {
        title: `Gaynor - (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA03260051.png?v=1774538058`,
        status: `available`
      },
      {
        title: `Gaynor - (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA03260041.png?v=1774538022`,
        status: `available`
      },
      {
        title: `Gaynor - (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA03260031.png?v=1774537985`,
        status: `available`
      },
      {
        title: `Gaynor - (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA03260021.png?v=1774537947`,
        status: `available`
      },
      {
        title: `Gaynor - (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA03260011.png?v=1774537908`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 795.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225013_1.png?v=1765885143`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225012_1.png?v=1765885104`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225011_1.png?v=1765885047`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225010_1.png?v=1765885006`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225009_1_3cae3cd5-2409-497d-b879-69f306334355.png?v=1765884970`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225008_1.png?v=1765884857`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225007_1.png?v=1765884767`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1225006_1.png?v=1765884733`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250051.png?v=1765200342`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250041.png?v=1765200274`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250031.png?v=1765200109`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250021_a88edf47-be01-487c-bb99-6b489fb628aa.png?v=1765200240`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250011.png?v=1765200006`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 795.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250021_65b0bc69-3971-4436-80ef-941c68a7b1d3.png?v=1764748751`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 795.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250031.png?v=1764169220`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 795.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250041_1ca733f9-bfb7-46a1-b3f8-61174128acb2.png?v=1764748723`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 795.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250011.png?v=1764169058`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 1950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0625006_1.png?v=1750406265`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 1950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0625005_1.png?v=1750406236`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0625004_1.png?v=1750406193`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0625003_1.png?v=1750406140`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0625002_1.png?v=1750406086`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0625001_1.png?v=1750405993`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0225005.png?v=1739776654`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0225004.png?v=1739776521`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0225003.png?v=1739776422`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0225002.png?v=1739776305`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 9890.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0225001.png?v=1739775979`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 2950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324008.png?v=1712051808`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324007.png?v=1712051776`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 2950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324006.png?v=1712051736`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 2950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324005.png?v=1712051704`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324004.png?v=1712051678`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324003.png?v=1712051635`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324002.png?v=1712051356`,
        status: `available`
      },
      {
        title: `Gaynor - Acrylic on Stretched Canvas`,
        price: 3490.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA0324001.png?v=1712051320`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1123003.png?v=1701331903`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1123002.png?v=1701331869`,
        status: `available`
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1123001.png?v=1701331826`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 18500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA08230121.png?v=1696355678`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA08230111.png?v=1696355633`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/80.png?v=1694607611`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/77.png?v=1694607475`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/76.png?v=1694607442`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/74.png?v=1694607371`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/72.png?v=1694601249`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/83.png?v=1694601187`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/82.png?v=1694601135`,
        status: `available`
      }
    ]
  },
  {
    id: `corne-weideman`,
    name: `Corne Weideman`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil & Acrylic`,
    style: `Landscapes, Figurative`,
    bio: `Corne Weideman: Capturing Life's Essence on Canvas

Born in the picturesque landscape of Rustenburg and later matriculating in the Western Cape's Robertson, Corne Weideman's artistic journey is a testament to the transformative power of mentorship and the pursuit of the profound. In 2010, he relocated to Cape Town, setting the stage for a remarkable artistic odyssey that followed the passing of his mentor, Adriaan Boshoff.

Under the wise tutelage of "Oom" Arrie, Corne's artistic roots were nurtured for three transformative months before embarking on a journey to Ireland, a sojourn that bore the blessings of Boshoff himself. Upon his return, Corne found a year-long haven with the "Old Master" and was initiated into the "Life of a true artist."

Reflecting on this providential path, Corne notes, "I never comprehended the effect, Boshoff's invitation to teach me would have on my life." He finds solace in the belief that art found him, guided by a higher hand.

Adriaan Boshoff, the guiding star of Corne's artistic voyage, left an indelible mark not only through technique but through the wisdom of life itself. "Oom Adriaan taught me how to be an artist," Corne reflects. "It's more than just the ability to paint. It's the way you perceive life and value every small moment, then capture those moments that people love."

Since 2005, Corne has been weaving his artistic tapestry, capturing the essence of life and the nuances of human existence. His remarkable growth has resonated with collectors worldwide, with his works finding homes in England, New Zealand, Australia, and beyond.

In the wake of Boshoff's passing in 2007, Corne embarked on a quest to explore the works of the old masters, discovering wisdom in the details of their artistry. The legacy of these masters, magnified through the lens of a magnifying glass, has become an integral part of Corne's artistic pursuit.

With unwavering dedication and a deep reverence for the craft, Corne Weideman continues his journey towards artistic perfection. In the footsteps of those who inspired him, he seeks not just to paint but to capture life's profound moments on canvas, preserving them for generations to come.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/12_4fb15bc2-e4ff-469e-8efc-65d3ba12f108.png?v=1757592363`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/corne-weideman-capturing-lifes-essence-on-canvas`,
    works: [
      {
        title: `Corne Weideman - 460mm x 270mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250271.png?v=1752068829`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 270mm`,
        price: 1750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250261.png?v=1752068795`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250251.png?v=1752068695`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250241.png?v=1752068662`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250231.png?v=1752068635`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250221.png?v=1752068596`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250211.png?v=1752068570`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250201.png?v=1752068532`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250191.png?v=1752068503`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250181.png?v=1752068468`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250171.png?v=1752068403`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250161.png?v=1752068368`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 890.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250151.png?v=1752068315`,
        status: `available`
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250141.png?v=1752068283`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250131.png?v=1752068095`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250121.png?v=1752068058`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250111.png?v=1752068027`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250101.png?v=1752067993`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250091.png?v=1752067960`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250081.png?v=1752067924`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250071.png?v=1752067895`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250061.png?v=1752067863`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250051.png?v=1752067827`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250041.png?v=1752067794`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250031.png?v=1752067749`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250021.png?v=1752067719`,
        status: `available`
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250011.png?v=1752067658`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924124a.png?v=1727084857`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924123a.png?v=1727084823`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924122a.png?v=1727084789`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924121a.png?v=1727084752`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924120a.png?v=1727084718`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924119a.png?v=1727084672`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924118a.png?v=1727084635`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924117a.png?v=1727084544`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924116A.png?v=1726228830`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924115A.png?v=1726228798`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924114A.png?v=1726228764`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924113A.png?v=1726228723`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924112A.png?v=1726228689`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924111A.png?v=1726228648`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924110A.png?v=1726228612`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924109A.png?v=1726228472`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924108A.png?v=1726228430`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924107A.png?v=1726228394`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924106A.png?v=1726228353`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924105A.png?v=1726228311`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924104A.png?v=1726228268`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924103A.png?v=1726228223`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924102A.png?v=1726227974`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924101A.png?v=1726227933`,
        status: `available`
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924100a.png?v=1726153226`,
        status: `available`
      }
    ]
  },
  {
    id: `emile-cronje`,
    name: `Emile Cronje`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic`,
    style: `Landscapes, Seascapes, Bo-Kaap`,
    bio: `Emile Cronje: Weaving Life's Tapestry in Color

Born in 1967, Emile Cronje carries the essence of artistry in his blood, a legacy inherited from his father, Gawie Cronje, a renowned South African impressionist. Emile, by nature, is an expressionist—an artist who reveals the world through his vivid, unique lens.

At the tender age of ten, Emile's artistic calling beckoned, and his distinct style began to captivate imaginations. His world is a bright, joyful canvas, mirroring the way he embraces life's vibrant hues.

Inspired by the legendary Gregoire Boonzaier, Emile masterfully weaves elements of the "old masters" into his creations. His success is the fruit of relentless study, observing scenes and objects before immortalizing his impressions on canvas and panel.

For over two decades, Emile's works have graced the homes of South Africans. In 2004, an invitation to exhibit at the South African House of Art in London affirmed his standing as a true artistic luminary. His journey is a testament to the transformative power of art, a journey that continues to breathe life and color into the world.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/10_2.png?v=1695060711`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/emile-cronje`,
    works: [
      {
        title: `Emile Cronje - Acrylic on Panel (600mm x 300mm)`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260011.png?v=1774538327`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel (600mm x 300mm)`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260021.png?v=1774538280`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel (580mm x 330mm)`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260031.png?v=1774538236`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel (610mm x 400mm)`,
        price: 3250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC12250041.png?v=1765200737`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel (590mm x 330mm)`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC12250031.png?v=1765200668`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel (450mm x 300mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC12250021450mmx300mm.png?v=1765200545`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel (450mm x 300mm)`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC12250011450mmx300mm.png?v=1765200486`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Stretched Canvas`,
        price: 2450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC08250031.png?v=1756725989`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Stretched Canvas`,
        price: 2450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC08250021.png?v=1756725953`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC08250011.png?v=1756725854`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC08250041.png?v=1756725468`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC08250061.png?v=1756725392`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC08250051.png?v=1756725354`,
        status: `available`
      },
      {
        title: `Emile Cronje - 900mm x 340mm`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC04250021.png?v=1752070529`,
        status: `available`
      },
      {
        title: `Emile Cronje - 900mm x 340mm`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC04250011.png?v=1752070499`,
        status: `available`
      },
      {
        title: `Emile Cronje - 450mm x 300mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250071.png?v=1752069237`,
        status: `available`
      },
      {
        title: `Emile Cronje - 450mm x 300mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250061.png?v=1752069203`,
        status: `available`
      },
      {
        title: `Emile Cronje - 450mm x 300mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250051.png?v=1752069176`,
        status: `available`
      },
      {
        title: `Emile Cronje - 450mm x 300mm`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250041.png?v=1752069135`,
        status: `available`
      },
      {
        title: `Emile Cronje - 590mm x 450mm`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250031.png?v=1752069077`,
        status: `available`
      },
      {
        title: `Emile Cronje - 590mm x 450mm`,
        price: 3450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250021.png?v=1752069045`,
        status: `available`
      },
      {
        title: `Emile Cronje - 590mm x 450mm`,
        price: 3450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC07250011.png?v=1752068972`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC1224001.png?v=1739956801`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC01250021_cc41f188-8440-4d42-9843-58418a19914e.png?v=1752070421`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC01250011_3d0ed8b3-04e2-445b-9c93-f42ea1d98205.png?v=1752070384`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC0224005.png?v=1710317409`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC0224004.png?v=1710317384`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC0224003.png?v=1710317351`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 4850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC0224002.png?v=1710317315`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Emile Cronje`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC0224001.png?v=1707984754`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC1123002.png?v=1702039916`,
        status: `available`
      },
      {
        title: `Emile Cronje - Acrylic on Panel`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC1123001.png?v=1702039739`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Emile Cronje`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/61.png?v=1694596222`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Emile Cronje`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/60.png?v=1694596027`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Emile Cronje`,
        price: 6450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/59.png?v=1694595913`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Emile Cronje`,
        price: 7500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/58.png?v=1694595804`,
        status: `available`
      }
    ]
  },
  {
    id: `aj-burns`,
    name: `AJ Burns`,
    born: null,
    birthplace: `South Africa`,
    medium: `Blown Acrylic`,
    style: `Koi, Water, Underwater`,
    bio: `AJ Burns: Breathing Life into Colours

AJ Burns' artistic journey has been a testament to the enduring nature of creativity. Though he painted prodigiously as a child, he faced discouragement from teachers and family during his high school years. As the world tried to suppress his artistic spark, AJ turned to civil engineering, swapping paintbrushes for setsquares and pencils.

After thriving as an entrepreneur in both the UK and South Africa, he ventured into the world of vodka distillery. However, the advent of Covid prohibition left him at a crossroads. It was during this uncertain period that AJ rekindled his artistic flame. A chance art class with an old friend led him back to the world of acrylics, a staggering 35 years after he had set them aside.

AJ's unique approach to painting emerged from curiosity and circumstance. In a garage without electricity, he experimented with the movement of paint. Lacking conventional tools, he resorted to blowing air with his own breath, watching in awe as one color gracefully danced through another.

Today, AJ continues to infuse life into his abstract masterpieces. With a deliberate yet unpredictable technique, he layers one color upon another and then breathes his own life into the canvas, creating vibrant and evocative compositions. His paintings become a burst of energy, a symphony of colors and textures that provoke a spectrum of emotions.

"The unpredictability of it fascinates me," AJ enthuses. "The paint seems to come to life; it keeps moving even when I've finished. And the colors evolve during the drying process, which can take up to two weeks in winter. It's always exciting to come back the next day to see what's happened to the painting."

In AJ Burns' world of art, creativity knows no bounds, and the canvas is a dynamic realm where colors and emotions entwine, breathing life into each stroke and reminding us that creativity is timeless.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/15_c21be0eb-39e9-43e9-8ecb-89142dc1b2d4.png?v=1757591409`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/aj-burns`,
    works: [
      {
        title: `AJ Burns - (900mm x 700mm)`,
        price: 15600.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/1_1.png?v=1776685361`,
        status: `available`
      },
      {
        title: `Many Parts To Each Of Us by AJ Burns (600mm x 400mm)`,
        price: 5500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260071.png?v=1771842480`,
        status: `available`
      },
      {
        title: `Fiery Redheads by AJ Burns (600mm x 400mm)`,
        price: 5500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260061.png?v=1771842397`,
        status: `available`
      },
      {
        title: `Common Goal by AJ Burns (600mm x 400mm)`,
        price: 5500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260051.png?v=1771842329`,
        status: `available`
      },
      {
        title: `Close but different by AJ Burns (600mm x 400mm)`,
        price: 5500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260041.png?v=1771842248`,
        status: `available`
      },
      {
        title: `AJ Burns - Go With The Flow (1600mm x 1000mm)`,
        price: 20000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJBAV001_16dc74fe-5af0-4a92-9ced-d9daa2b29bcc.jpg?v=1771066286`,
        status: `available`
      },
      {
        title: `Each on Our Own Path by AJ Burns (1600mm x 1000mm)`,
        price: 29500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB10250091.png?v=1761295896`,
        status: `available`
      },
      {
        title: `Colourful by AJ Burns (1600mm x 1000mm)`,
        price: 29500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025008AJBurnsColourfulLife160x100cm1.png?v=1761295815`,
        status: `available`
      },
      {
        title: `A Little Left of Centre by AJ Burns (1200mm x 740mm)`,
        price: 21500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025007AJBurnsALittleLeftofCentre120x74cm1.png?v=1761295746`,
        status: `available`
      },
      {
        title: `Do You See Me by AJ Burns (1200mm x 740mm)`,
        price: 21500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025006AJBurnsDoyouseeme120x74cm1.png?v=1761295656`,
        status: `available`
      },
      {
        title: `Intersecting Paths by AJ Burns (1200mm x 740mm)`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025005AJBurnsIntersectingPaths120x74cm1.png?v=1761295541`,
        status: `available`
      },
      {
        title: `Keep Exploring by AJ Burns (900mm x 700mm)`,
        price: 15400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025004AJBurnsKeepExploring90x70cm1.png?v=1761295443`,
        status: `available`
      },
      {
        title: `Coming Full Circle by AJ Burns (900mm x 700mm)`,
        price: 15400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025003AJBurnsComingFullCircle90x70cm1.png?v=1761295377`,
        status: `available`
      },
      {
        title: `Best Buddies by AJ Burns (900mm x 700mm)`,
        price: 15400.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB10250021_2AJBurnsBestBuddies90x70cm1.png?v=1761295247`,
        status: `available`
      },
      {
        title: `Peaceful by AJ Burns (600mm x 400mm)`,
        price: 4800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB10250011_1AJBurnsPeaceful60x40cm1.png?v=1761294931`,
        status: `available`
      },
      {
        title: `Serenity by AJ Burns`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJ0823106.png?v=1699949509`,
        status: `available`
      },
      {
        title: `Cruising by AJ Burns`,
        price: 24500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJ0823105.png?v=1699949445`,
        status: `available`
      },
      {
        title: `Crossed Paths by AJ Burns`,
        price: 29500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJ0823104.png?v=1699949370`,
        status: `available`
      },
      {
        title: `Reef by AJ Burns`,
        price: 29500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NeutralElegantMinimalistShadowWallArtMockupInstagramPost.png?v=1694442047`,
        status: `available`
      },
      {
        title: `Happy Couple by AJ Burns`,
        price: 1500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/2.png?v=1694441754`,
        status: `available`
      },
      {
        title: `First Date by AJ Burns`,
        price: 1500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/1.png?v=1694441778`,
        status: `available`
      }
    ]
  },
  {
    id: `anton-gericke`,
    name: `Anton Gericke`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic`,
    style: `Abstract, Spiritual`,
    bio: `Anton Gericke: The Symphony of Creation in Art

Born in the vibrant tapestry of Johannesburg in 1947, Anton Gericke's artistic odyssey began at the tender age of eight, when he first wielded the magic of oil paints. His journey led him through the hallowed halls of Pearson, Port Elizabeth, and into the realm of Pharmacy, where he pursued his studies at Pretoria University and Potchefstroom.

Beyond his academic pursuits, Anton instilled in his daughters, Murentia Moffat and Carla Bosch, a profound appreciation for the divine beauty that graces God's creation. For four decades, Anton has been a pillar of "Community Pharmacy Services" in Pretoria City Center, serving with dedication at "Debruynpark Pharma Friend." His talents are not confined to pharmaceuticals alone; he is also a gifted saxophonist, lending his melodies to the songs of his local church.

Now, in the fullness of time, Anton Gericke embarks on a new chapter as a full-time artist. With each brushstroke, he seeks to capture the expression of God's boundless creation. In his own words, "Art gives expression to the beauty of God's creation!" With Anton, the canvas becomes a symphony, a testament to the enduring beauty that surrounds us all.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/13_2.png?v=1694446219`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/anton-gericke-the-symphony-of-creation-in-art`,
    works: [
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924010.png?v=1726150241`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924009.png?v=1726150203`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924008.png?v=1726150107`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 37800.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924007.png?v=1726149938`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 23880.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924006.png?v=1726149473`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 24880.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924005.png?v=1726149405`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 23880.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924004.png?v=1726149276`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924003.png?v=1726149093`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 17880.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924002.png?v=1726148948`,
        status: `available`
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 15480.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924001.png?v=1726146059`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 4500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/18.png?v=1694444220`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 4500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/17.png?v=1694444128`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/16.png?v=1694444081`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/15.png?v=1694444034`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/14.png?v=1694443936`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/13.png?v=1694443869`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/12.png?v=1694443767`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/11_80dc09a4-925b-4742-8a82-7fbc40bb260d.png?v=1694443620`,
        status: `available`
      }
    ]
  },
  {
    id: `harry-erasmus`,
    name: `Harry Erasmus`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil & Acrylic`,
    style: `Whimsical, Fantasy, Naïve`,
    bio: `Harry Erasmus: Painting the Whimsy of Life

Harry Erasmus stands as one of South Africa's most delightfully idiosyncratic artists, known for his unparalleled talent in translating a whimsical imagination onto canvas. Born in Pretoria in 1961, Harry's love affair with art ignited at an early age, a passion that would become his life's defining narrative.

In the crucible of adversity, Harry's art became a beacon of light. Despite early hardships, he chose to infuse his creations with the radiant world of his childhood imagination, steering clear of darker themes.

Lacking formal training, Harry proudly carved his own artistic path, a journey that guides viewers into a realm of untamed whimsy. His works, described as "gesels-kuns" in Afrikaans, invite conversations with the soul.

From 2016 to 2018, Harry found solace in his studio nestled within The Winelands Art Gallery. We are honored to showcase his enchanting masterpieces, each brushstroke a testament to his unique gift for evoking joy and fostering dialogue through art.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/8_3.png?v=1695061014`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/harry-erasmus`,
    works: [
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE0526003_1.png?v=1777556294`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE0526002_1.png?v=1777556240`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE0526001_1.png?v=1777556192`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE03260021.png?v=1777556146`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE03260011.png?v=1777556092`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 410mm x 200mm`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260031.png?v=1777555988`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 350mm x 250mm`,
        price: 2750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260021.png?v=1771590720`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 350mm x 250mm`,
        price: 2750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260011.png?v=1771590659`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 1600mm x 600mm`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250041.png?v=1758526812`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 1600mm x 600mm`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250031.png?v=1758526779`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 1600mm x 600mm`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250021.png?v=1758526659`,
        status: `available`
      },
      {
        title: `Harry Erasmus - 1600mm x 600mm`,
        price: 19500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250011.png?v=1758525953`,
        status: `available`
      },
      {
        title: `Harry Erasmus - Acrylic on Stretched Canvas`,
        price: 11900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE0924001A1000x750.png?v=1726230578`,
        status: `available`
      },
      {
        title: `Harry Erasmus - Acrylic on Stretched Canvas`,
        price: 28500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/35.png?v=1694979613`,
        status: `available`
      },
      {
        title: `Acrylic on Stretched Canvas by Harry Erasmus`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/34.png?v=1694979532`,
        status: `available`
      },
      {
        title: `Acrylic on Stretched Canvas by Harry Erasmus`,
        price: 1450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/30.png?v=1694979198`,
        status: `available`
      },
      {
        title: `Acrylic on Stretched Canvas by Harry Erasmus`,
        price: 1150.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/28.png?v=1694978903`,
        status: `available`
      }
    ]
  },
  {
    id: `ian-hertslet`,
    name: `Ian Hertslet`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil`,
    style: `Landscapes, Seascapes`,
    bio: `Ian Hertslet: The Visionary Brush of Contemporary South African Art

Ian Hertslet is a beacon in the realm of contemporary South African art, renowned for his uniquely expressive oil paintings. His canvases serve as captivating explorations of diverse themes, marked by the remarkable fusion of abstract and figurative forms.

Hertslet's art defies convention with bold splashes of color and dynamic brushwork, challenging artistic traditions and sparking profound reflection. His vision has resonated deeply, amassing a passionate following both locally and across borders. His creations grace galleries and art fairs worldwide, a testament to their universal appeal.

In essence, Ian Hertslet's paintings strike a chord with art enthusiasts who seek not only artistic mastery but also a contemporary relevance that invites us to push the boundaries of creativity.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/6_2.png?v=1695061104`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/ian-hertslet`,
    works: [
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 34500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0226005.png?v=1770370442`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 34500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0226004.png?v=1770370376`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 27600.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0226003.png?v=1770370248`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 19750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0226002.png?v=1770370204`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 19750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0226001.png?v=1770369801`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Stretched Canvas`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0224001.png?v=1708942994`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Stretched Canvas`,
        price: 9450.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0124002.png?v=1705572010`,
        status: `available`
      },
      {
        title: `Ian Hertslet - Oil on Stretched Canvas`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0124001.png?v=1705571953`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Ian Hertslet`,
        price: 28500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH0823001.png?v=1770369626`,
        status: `available`
      }
    ]
  },
  {
    id: `thomas-kohler`,
    name: `Thomas Kohler`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Landscapes, Figurative`,
    bio: `Thomas Kohler: Where Sea, Memory, and Canvas Meet

Born in 1964 in Cape Town, Thomas Kohler spent part of his youth in Germany after his family left South Africa during the unsettled years of the 1970s. Educated in Cologne as a graphic designer, he returned home in 1988 and spent nearly two decades in the fast-paced world of advertising. In 2004, seeking a quieter and more meaningful rhythm, he turned fully to painting.

The sea has long shaped Kohler’s imagination. Ships run deep in his family’s history—his great-grandfather built them, his father sailed them, and family voyages across the Atlantic left lasting impressions. Living in Grotto Bay on the West Coast, he draws daily inspiration from the Atlantic Ocean, striving to capture its shifting light, moods, and power.

Thomas also paints people, drawn to the subtle drama of human interaction. A self-described traditionalist with a quirky edge, he paints largely for private collectors, preserving memories of places, families, and the enduring pull of the sea.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/10_2_7d87a03a-e3ef-4f25-9d07-0ca715954ef4.png?v=1774946216`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/thomas-kohler-art`,
    works: [
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2022 Expectations"`,
        price: 5500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224009.png?v=1707989116`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2021 Winter Storm"`,
        price: 6750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224008.png?v=1707989018`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2022 Danneborg "`,
        price: 9500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224007.png?v=1707988926`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2021 Flying Kites"`,
        price: 10500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224006.png?v=1707988804`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2019 Fishing Lesson"`,
        price: 4500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224005.png?v=1707988704`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2019 Autumn"`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224004.png?v=1707988552`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2017 Sydney Harbour"`,
        price: 8950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224003.png?v=1707988455`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2017 Public Transport in Norway "`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224002.png?v=1707988340`,
        status: `available`
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2007 Rounding Lighthouse"`,
        price: 13500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224001.png?v=1707988066`,
        status: `available`
      }
    ]
  },
  {
    id: `junior-fungai`,
    name: `Junior Fungai`,
    born: null,
    birthplace: `Zimbabwe`,
    medium: `Acrylic`,
    style: `African, Vibrant, Figurative`,
    bio: `Junior Fungai: A Brush with African Excellence

Born in 1980 in Harare, Zimbabwe, Junior Fungai's artistic journey is a testament to his unwavering dedication to the craft. He honed his skills at the B.A.T. Studios of the National Gallery of Zimbabwe, earning a fine arts diploma that marked the commencement of a remarkable career.

Recognition swiftly followed, with Fungai claiming first prize in graphics at the Cottco of Zimbabwe's annual exhibition and second prize in design at the Gwenyambira Exhibition, both hosted by the N.G.Z.

Fungai's art finds itself in prestigious galleries, including The Winelands Art Gallery, the Amazwi Gallery and many others. His work has graced special exhibitions such as the Cottco Young Artists Exhibition, the Black Like Us competition at Norscot Manor Gallery and the La Concorde African Artist Exhibition in Norwood.

In August 2010, Fungai's art crossed borders for a special exhibition at Amazwi Contemporary Art in Saugatuck, Michigan, USA, further solidifying his status as a venerated African artist whose brush strokes resonate across continents.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/19_1.png?v=1695061428`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/junior-fungai`,
    works: [
      {
        title: `Junior Fungai - Acrylic on Canvas Panel`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JF1123002.png?v=1699952075`,
        status: `available`
      },
      {
        title: `Junior Fungai - Acrylic on Canvas Panel`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JF1123001.png?v=1699951994`,
        status: `available`
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 7475.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JF091E.png?v=1696356176`,
        status: `available`
      },
      {
        title: `Acrylic on Stretched Canvas by Junior Fungai`,
        price: 3850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/95.png?v=1694704121`,
        status: `available`
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 6900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/99.png?v=1694704006`,
        status: `available`
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 6900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/98.png?v=1694703941`,
        status: `available`
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/96_9ad335bb-aa59-45b2-82ce-5674090fa784.png?v=1694703718`,
        status: `available`
      },
      {
        title: `Acrylic on Canvas Panel by Junior Fungai`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/94.png?v=1694608729`,
        status: `available`
      }
    ]
  },
  {
    id: `gerhard-fourie`,
    name: `Gerhard Fourie`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic on Canvas`,
    style: `Landscapes, Seascapes`,
    bio: `Gerhard Fourie: Painting the Color of a Life Well Lived

Gerhard Fourie’s artistic journey began long before he ever lifted a paintbrush professionally. As a schoolboy, he was known for sketching biology illustrations for classmates and drawing the sleek lines of Ferraris and Lamborghinis—early signs of a creative spirit quietly taking shape.

After school, he studied Physical Education at the University of the Orange Free State, earned a teaching degree, and completed two years of military service, as many young South Africans of his generation did. Teaching posts in Steytlerville, Velddrift, and later Port Elizabeth followed, where he built both a career and a family life.

Following twenty years in education, Fourie entered the business world, investing in a filling station. Yet it was during this season of life that painting truly called him home. Today, he is celebrated for his vibrant landscapes, richly infused with color and warmth.

Now living in Still Bay, surrounded by river and sea, Fourie continues to paint the beauty of the world around him.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/1_9c964a70-620a-47bf-bca0-d550678d0995.png?v=1779197428`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/gerhard-fourie`,
    works: [
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260061.png?v=1779198545`,
        status: `available`
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260051.png?v=1779198494`,
        status: `available`
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260041.png?v=1779198435`,
        status: `available`
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260031.png?v=1779198378`,
        status: `available`
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260021.png?v=1779198319`,
        status: `available`
      },
      {
        title: `Gerhard Fourie - 600mm x 300mm`,
        price: 2300.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260011.png?v=1779198135`,
        status: `available`
      }
    ]
  },
  {
    id: `rozanne-henning`,
    name: `Rozanne Henning`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil & Acrylic`,
    style: `Landscapes, Figurative`,
    bio: `Rozanne Henning: From Canvas to Culinary and Back Again

Rozanne's voyage into the realm of art was a homecoming to a world steeped in creativity, where pottery wheels spun and paint splattered early impressions on the canvas of her life. Armed with an education from the University of Pretoria, she embarked on a multifaceted journey, adding a dash of culinary flair to her artistic pursuits. In the enchanting setting of Stellenbosch, she honed her skills, emerging as a certified chef, before donning the cherished roles of a loving wife and mother to two daughters.


Yet, nature's timeless elegance beckoned. Rozanne's portraits, brought to life with acrylic and oil on canvas, stand as living testaments to her enduring love affair with the natural world. Her art captures the essence of nature's beauty and its vibrant tapestry of colors, inviting us to behold the world through her eyes—a world where creativity knows no bounds.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/Artist_Photos_1.png?v=1695061673`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/rozanne-henning`,
    works: [
      {
        title: `Rozanne Henning Oil on Stretched Canvas`,
        price: 6350.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/RH1123005910mmx610mm1.png?v=1699343104`,
        status: `available`
      },
      {
        title: `Rozanne Henning Oil on Stretched Canvas`,
        price: 4850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/RH1123003720mmx560mm1.png?v=1699342954`,
        status: `available`
      },
      {
        title: `Rozanne Henning Oil on Stretched Canvas`,
        price: 8500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/RH1123001900mmx750mm1.png?v=1699342821`,
        status: `available`
      },
      {
        title: `Rozanne Henning Oil on Stretched Canvas`,
        price: 2950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/RH0923004490mmx450mmcopy4.png?v=1696356807`,
        status: `available`
      },
      {
        title: `Rozanne Henning Oil on Stretched Canvas`,
        price: 2650.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/RH0923003610mmx460mmcopy3.png?v=1696356723`,
        status: `available`
      },
      {
        title: `Rozanne Henning Oil on Stretched Canvas`,
        price: 2250.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/RH0923002400mmx400mmcopy2.png?v=1696356634`,
        status: `available`
      }
    ]
  },
  {
    id: `stef-van-den-berg`,
    name: `Stef van den Berg`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic on Panel`,
    style: `Contemporary`,
    bio: `Stef van den Berg: A Professor of Art

Known by both Stef and Riaan van den Berg, this artistic talent forged a remarkable path in the world of art. After retiring from his role as a professor of art at the University of Potchefstroom, Stef transitioned into a new chapter, opening a thriving business in Parys.

His artistic legacy stretches far beyond the borders of South Africa, leaving an indelible mark on both local and international art markets. Collectors from around the world have sought and cherished his works, transforming his creations into prized treasures that transcend geographic boundaries.

In the vivid strokes and nuanced palettes of Stef van den Berg's art, we glimpse a lifetime of passion, dedication, and unwavering commitment to the craft. His canvas becomes a reflection of a life lived in brilliance, where art knows no bounds, and creativity flows freely.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/Stef_van_den_Berg.png?v=1695061975`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/stef-van-den-berg`,
    works: [
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 4950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/133.png?v=1694971561`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 4950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/132.png?v=1694971510`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/131.png?v=1694971429`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/130.png?v=1694971376`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/129.png?v=1694971283`,
        status: `available`
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/128.png?v=1694971230`,
        status: `available`
      }
    ]
  },
  {
    id: `craig-stuart`,
    name: `Craig Stuart`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Koi, Water Art`,
    bio: `Craig Stuart: Painting the Quiet Power of Water

Craig Stuart, a Scottish-born artist now based in Cape Town, is a graduate of the Glasgow School of Art. Water lies at the heart of his artistic vision—both as subject and as method—shaped by early encounters that stirred equal measures of curiosity and unease: dark depths set against sudden flashes of light.

While living in Glasgow, Stuart often wandered the abandoned shipyards of Govan, where weathered steel and oxidised reds left a lasting impression on his palette. His approach reflects the discipline of printmaking—layered, restrained, and deliberate—while time spent along the coast of South Korea introduced an aesthetic of balance, clarity, and quiet movement.

Working between control and chance, Stuart allows fluid elements to shape the final image. In recent years, forms such as koi and lilies have emerged more distinctly in his work—the koi, especially, symbolising perseverance and transformation. His paintings and prints have been exhibited in galleries internationally.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/10_2_df1040aa-e9b9-4b18-a255-58193f59913c.png?v=1774950871`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/craig-stuart`,
    works: [
      {
        title: `Craig Stuart - (613mm x 307mm)`,
        price: 6900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260051.png?v=1774952470`,
        status: `available`
      },
      {
        title: `Craig Stuart - (613mm x 307mm)`,
        price: 6900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260041.png?v=1774952430`,
        status: `available`
      },
      {
        title: `Craig Stuart - (607mm x 457mm)`,
        price: 14500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260031.png?v=1774952300`,
        status: `available`
      },
      {
        title: `Craig Stuart - (840mm x 595mm)`,
        price: 23000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260021.png?v=1774952224`,
        status: `available`
      },
      {
        title: `Craig Stuart - (1189mm x 840mm)`,
        price: 35000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260011.png?v=1774952033`,
        status: `available`
      }
    ]
  },
  {
    id: `louise-de-klerk`,
    name: `Louise de Klerk`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Landscapes, Figurative`,
    bio: `Louise de Klerk: Painting Life's Vibrant Stories

Born in the vibrant city of Johannesburg in 1967, Louise de Klerk's roots extend deep into the picturesque countryside of the Northern Cape. Her formative years were steeped in a sense of nostalgia, a time when children reveled in the freedom to play untamed, attending school barefoot, and hitching a horsecart for a school bus. It was during these cherished days that Louise's innate artistic flair began to bloom.

Her educational journey took her to Klerksdorp, where she matriculated before embarking on an academic pursuit that led to her earning a BA Comm Honors Degree. Surrounded by art students who became her closest friends, she found herself drawn to the vibrant world of creativity.

Louise initially engaged with her family business, but the call of art tugged relentlessly at her soul. In 2004, she answered that call wholeheartedly, dedicating herself to her artistry. For Louise, the canvas became her sanctuary, where colors swirled in harmonious chaos and imagination knew no bounds.

While she largely identifies as a self-taught artist, Louise's thirst for knowledge led her to absorb insights from fellow artists she regards as mentors. Her artistry thrives on experimentation, and she gracefully navigates a range of styles, techniques, and subjects. Among her favored explorations, the human face and figure hold a special place. Whether rendered in classical, romantic, abstract, or even whimsical forms, these figures unveil her multifaceted creativity.

Her preferred medium is oils, though acrylics and mixed media also dance upon her canvases. Inspiration finds its roots in the world around her, from the people she encounters to the landscapes that stir her memories. Louise's art beckons viewers into a realm where reality interlaces with dreamscapes, and every stroke of her brush tells a story.

Louise's artistic journey has graced numerous group and solo exhibitions, leaving an indelible mark on art enthusiasts and galleries throughout the country. Her works have become cherished pieces, breathing life into the spaces they adorn, and inviting all to explore the kaleidoscope of her creativity.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/Artist_Photos_LDK.png?v=1696534757`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/louise-de-klerk`,
    works: [
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK10230051.png?v=1696534532`,
        status: `available`
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK10230041.png?v=1696534491`,
        status: `available`
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK10230031.png?v=1696534449`,
        status: `available`
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK10230021.png?v=1696534379`,
        status: `available`
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK10230011.png?v=1696534254`,
        status: `available`
      }
    ]
  },
  {
    id: `marina-k`,
    name: `Marina K`,
    born: null,
    birthplace: `Cape Town`,
    medium: `Oil on Canvas`,
    style: `Cape Town, Seascapes`,
    bio: `Marina K: Painting Memory, Light, and Place

Born and raised in Estonia, Marina K’s artistic sensibility was shaped by the quiet beauty and shifting seasons of Northern Europe. Nearly two decades ago, she made South Africa her home, where the country’s warmth, luminous skies, and vibrant energy awakened a new dimension in her work.

Her paintings are distinguished by expressive colour, richly layered textures, and delicate touches of gold and light that evoke both atmosphere and emotion. Drawing inspiration from memory, place, and the poetry of ordinary life, Marina creates works that feel intimate yet universally familiar.

There is a quiet nostalgia woven through her canvases—a gentle invitation for viewers to pause, reflect, and reconnect with moments often overlooked. Through her evolving body of work, Marina explores the enduring relationship between emotion and environment, revealing beauty not in grandeur, but in life’s quieter passages.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/DSCF1074_edit_1317786427640832.jpg?v=1779197895`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/marina-k`,
    works: [
      {
        title: `Marina K - After the Rain (1200mm x 900mm)`,
        price: 14950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260041.png?v=1779199074`,
        status: `available`
      },
      {
        title: `Marina K - Cape Town Dreams (1200mm x 900mm)`,
        price: 14950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260031.png?v=1779199000`,
        status: `available`
      },
      {
        title: `Marina K - Above the Atlantic (500mm x 360mm)`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260021.png?v=1779198928`,
        status: `available`
      },
      {
        title: `Marina K - Keeper of the Light (500mm x 360mm)`,
        price: 3950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260011.png?v=1779198762`,
        status: `available`
      }
    ]
  },
  {
    id: `anmari`,
    name: `Anmari`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic`,
    style: `Figurative, Compassionate`,
    bio: `Anmari: Painting a Legacy of Compassion

Anmari's life has been a journey defined by the pursuit of bettering the human condition. Trained as a social worker, she dedicated herself to making a profound difference in the lives of others. Yet, it was in the later chapters of her life that a hidden talent, an uncharted passion, was unveiled: the gift of artistry.


Today, Anmari proudly finds her place among the represented artists of The Winelands Art Gallery. In a retirement home, where many might see an end to creative potential, she discovered a vibrant new beginning. As a self-taught artist, her canvases now resonate with the colors of her soul, each stroke a testament to a lifetime of experiences and an unwavering commitment to paint her way through the years ahead.

For Anmari, art isn't just a newfound pursuit; it's a lifelong commitment—a promise to herself and the world. In her work, she continues to touch hearts, leaving behind a legacy of compassion that speaks to the enduring power of the human spirit in every stroke of the brush.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/14_2.png?v=1693929176`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/anmari-painting-a-legacy-of-compassion`,
    works: [
      {
        title: `Anmari - Acrylic on Blocked Panel`,
        price: 1500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/ANG10230031.png?v=1698329490`,
        status: `available`
      },
      {
        title: `Anmari - Acrylic on Blocked Panel`,
        price: 1500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/ANG10230021.png?v=1698329443`,
        status: `available`
      },
      {
        title: `Anmari - Acrylic on Blocked Panel`,
        price: 1500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/ANG10230011.png?v=1698329362`,
        status: `available`
      },
      {
        title: `Anmari - Acrylic on Blocked Panel`,
        price: 1500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/ANG0823004AcryliconBlockedPanel600mmx400mm4.png?v=1696354320`,
        status: `available`
      }
    ]
  },
  {
    id: `frances-wedepohl`,
    name: `Frances Wedepohl`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil & Acrylic`,
    style: `Landscapes, Still Life`,
    bio: `Frances Wedepohl: Capturing the Soul of South Africa Through Art

Frances Wedepohl's artistic journey began in the heart of Johannesburg, where her love for art and creativity bloomed from a young age. She had a penchant for bright colors, shapes, and textures, and her youthful enthusiasm found expression on every canvas of her world.

A transformative encounter with the work of JH Pierneef left an enduring imprint on her creative spirit. "I'd like to think his work has strongly influenced mine," Frances reflects, "I feel a deep connection to his play of light, lines, balance, and serenity."

When she paints, the world falls into a hushed reverence, accompanied only by the melodies of her beloved 70s music collection. Frances draws inspiration from her journeys, both real and imagined, preserving landscapes in her art to etch them into her heart. The South African landscape, with its sun-drenched soil, heat, and expansive sky, remains her eternal muse.

With a diverse background in architectural draughting and a preference for a creamy palette of oil paints, Frances intricately weaves details and wields precise brushwork. Her palette may be limited, but it yields a rich spectrum of hues, a secret handed down by Louis Audie, another of South Africa's artistic luminaries.

Frances's art has graced the pages of The Art Times magazine and adorned galleries worldwide. Her works have found homes across continents, from South Africa to Australia, Saudi Arabia to Sweden, testifying to the universal appeal of her craft.

As she reflects on her journey, Frances expresses gratitude for the support of family, friends, and cherished clients who have walked alongside her. In the timeless words of William Shakespeare, she finds her guiding principle: "To thine own self be true." Frances Wedepohl's artistic truth shines through her canvases, capturing the essence of South Africa with every stroke.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/17_1.png?v=1695060799`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/frances-wedepohl`,
    works: [
      {
        title: `Oil on Stretched Canvas by Frances Wedepohl`,
        price: 4550.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FW0823008710mmx560mm1.png?v=1696532437`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Frances Wedepohl`,
        price: 5850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FW0823006760x3801.png?v=1696532323`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Frances Wedepohl`,
        price: 5950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FW08230041000x5001.png?v=1696532221`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Frances Wedepohl`,
        price: 6500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FW0823003700x550oilonstretch3.png?v=1696532191`,
        status: `available`
      }
    ]
  },
  {
    id: `jonel-scholtz`,
    name: `Jonel Scholtz`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Figurative, Impressionism`,
    bio: `Jonel Scholtz: Painting the Interior Landscape

Jonel Scholtz approaches art with both the discipline of a scientist and the sensitivity of a storyteller. After earning a degree in Chemistry and Biochemistry from the University of Johannesburg in 1994, she continued a painting journey that had begun years earlier under the guidance of American-born artist Louise Goudemond.

Over the years, Scholtz has exhibited widely in South Africa and internationally, with her work appearing in galleries and exhibitions across New York, London, Monaco, Italy, Mauritius, and Paris. Her paintings—often deeply personal and emotionally reflective—have earned international recognition, including awards from the Los Angeles-based Teravarna Gallery.

Yet beneath the accolades lies an artist more concerned with truth than acclaim. For Scholtz, painting is an act of discovery, a search for meaning within the complexities of memory, loss, love, and identity. She believes art should emerge from the soul rather than commerce, and this conviction gives her work its enduring emotional resonance.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/3_755c4c39-8111-4ffc-911f-3edb35152101.png?v=1779884695`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/jonel-scholtz`,
    works: [
      {
        title: `Jonel Scholtz - "I'm Still Here" (1210mm x 910mm)`,
        price: 18500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526003_1.png?v=1779886752`,
        status: `available`
      },
      {
        title: `Jonel Scholtz - "The Weight of Quiet Things" (1210mm x 910mm)`,
        price: 18500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526002_1.png?v=1779886670`,
        status: `available`
      },
      {
        title: `Jonel Scholtz - "As 'n Draai jou Omgooi" (1010mm x 760mm)`,
        price: 12850.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526001_1.png?v=1779886386`,
        status: `available`
      }
    ]
  },
  {
    id: `ferdinand-kotze`,
    name: `Ferdinand Kotze`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Panel`,
    style: `Surrealism`,
    bio: `Ferdinand Kotze: Fragments of Memory and Modern Life

Ferdinand Kotze is a multidisciplinary artist whose work moves between oil painting, video, and audio production, exploring the fragile relationship between memory, time, and technological change. Through layered compositions that combine oil paint, collage, and translucent figurative forms on trace paper, Kotze creates images that feel suspended between remembrance and disappearance.

His paintings draw upon the visual traditions of Surrealism and early Modernism while engaging the fractured aesthetics of the digital age. Abandoned buildings, weathered vehicles, and quiet industrial spaces—deeply rooted in South Africa’s evolving landscape—form the backdrop to ghostlike figures and fleeting childhood memories.

Beneath the stillness of his work lies a meditation on impermanence. Kotze examines how rapidly changing technology reshapes human experience, memory, and identity itself. His art occupies a thoughtful space between archaeology and psychology, asking what remains of our shared histories in a world moving ever faster toward the digital horizon.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/Final.png?v=1779884834`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/ferdinand-kotze`,
    works: [
      {
        title: `Ferdinand Kotze - "Fragments of Play: Red Balloon" (1010mm x 760mm)`,
        price: 23500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526003_1.png?v=1779886093`,
        status: `available`
      },
      {
        title: `Ferdinand Kotze - "Fragments of Play: Leapfrog" (1010mm x 760mm)`,
        price: 23500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526002_1.png?v=1779886023`,
        status: `available`
      },
      {
        title: `Ferdinand Kotze - "Fragments of Play: Toss The Baby" (760mm x 600mm)`,
        price: 11500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526001_1.png?v=1779885791`,
        status: `available`
      }
    ]
  },
  {
    id: `dante-ruben`,
    name: `Dante Ruben`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Figurative, Landscapes`,
    bio: `Dante Ruben: Painter of Coastal Light and Working Lives

Dante Ruben, now based in the coastal town of Langebaan, draws deeply from the landscapes and communities that have shaped her artistic life. For twelve formative years she lived in the Overberg, a region long associated with notable painters such as Gregoire Boonzaier, Marjorie Wallace, and Maggie Laubser. There she found inspiration not only in the scenery, but in the quiet dignity and colorful stories of working people—fishermen at sea and fynbos harvesters gathering proteas from surrounding farms.

Those years left a lasting impression on her canvas. Today, with the Atlantic winds and luminous winter sunsets of Langebaan as her backdrop, Ruben continues to interpret the rhythms of coastal life. Her paintings, marked by an exuberant palette and an impressionistic touch, celebrate both landscape and humanity. The result is a body of work that resonates with collectors at home and abroad, drawn to her ability to transform everyday moments into scenes of warmth, color, and enduring character.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/10_2_8610cc38-112e-4936-bd85-565c2bd17a75.png?v=1774948950`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/dante-ruben`,
    works: [
      {
        title: `Dante Ruben - (610mm x 510mm)`,
        price: 14950.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR05260011.png?v=1779199638`,
        status: `available`
      },
      {
        title: `Dante Ruben - (1500mm x 900mm)`,
        price: 35000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR03260021.png?v=1774949699`,
        status: `available`
      },
      {
        title: `Dante Ruben - (900mm x 900mm)`,
        price: 18900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR03260011.png?v=1774949632`,
        status: `available`
      }
    ]
  },
  {
    id: `isabel-le-roux`,
    name: `Isabel le Roux`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Landscapes, Figurative`,
    bio: `Isabel le Roux: Isabel le Roux: Capturing the Vibrancy of South Africa

Born in Rustenburg, nestled at the base of South Africa's majestic Magaliesberg mountain range, Isabel le Roux embarked on a lifelong odyssey through the world of art. Her story began as an art teacher, but it was in 1974 that she took the leap into the professional realm of painting.

Isabel's artistic voice is a dynamic tapestry woven with threads of expressionism and contemporary flair. Her canvas bursts to life with the vivid, audacious strokes of color, capturing the essence of South African landscapes and its people, particularly the Cape. Oils are her favored medium, yet she boldly explores acrylics, watercolors, pen on paper, and mixed media, shaping each creation with unwavering passion.

What sets Isabel apart is her boundless commitment to her craft. Her artwork breathes with life, a testament to her ceaseless exploration and her enriching travels across the globe. Through the lens of her creativity, South Africa unfurls in all its resplendent beauty.

Isabel le Roux is not just an artist; she is a phenomenon. Her artistic journey has been studded with milestones—a staggering thirty-seven solo and group exhibitions both locally and on international stages. Her dedication recently earned her a three-month sabbatical in the "Cite International Des Artes" in the heart of Paris, a recognition of her indomitable spirit and unwavering contribution to the world of art.

Isabel's canvas is more than a surface; it's a gateway to South Africa's soul, and her art is an invitation to explore the vivid palette of a nation through her eyes.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/2_7.png?v=1695061240`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/isabel-le-roux`,
    works: [
      {
        title: `Isabel le Roux - Oil on Stretched Canvas`,
        price: 16500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IL0524002.png?v=1716451836`,
        status: `available`
      },
      {
        title: `Isabel le Roux - Oil on Stretched Canvas`,
        price: 37500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IL0524001.png?v=1716451719`,
        status: `available`
      },
      {
        title: `Oil on Stretched Canvas by Isabel le Roux`,
        price: 22500.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IL0823003800mmx600mmcopy3.png?v=1696355922`,
        status: `available`
      }
    ]
  },
  {
    id: `niki-mcqueen`,
    name: `Niki McQueen`,
    born: null,
    birthplace: `South Africa`,
    medium: `Mixed Media`,
    style: `Contemporary`,
    bio: `Niki McQueen: The Art of Surreal Realities

Niki McQueen, a visual artist and communications and graphic design specialist from Cape Town, blends her background in Marine Biology with a unique artistic vision. Amid the Covid pandemic, Niki developed a distinctive technique, crafting richly colored, surreal artworks from digital composites. These pieces are meticulously hand-printed and hand-drawn onto heavy archival papers, then washed, painted, and finished through a perfected 10-step process.

Inspired by vintage medical and scientific illustrations, surrealism, street art, and magical realism, Niki’s work delves into personal symbolism and fantastical realms. Her themes encompass anatomy, biology, psychology, mythology, innocence, joy, and the cycle of decay and rebirth. Each piece invites viewers to find their own interpretations.

With over 600 artworks, Niki's portfolio is divided into two parts: her surreal and symbolic fine art under "Niki McQueen Art," and the playful, childlike expressions of "Life Beyond Reason." Through her art, Niki channels psychological and emotional experiences, creating works that evoke both introspection and joy.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/2.jpg?v=1716198912`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/niki-mcqueen`,
    works: [
      {
        title: `Niki McQueen - "Travels by Moonlight" Mixed Media on Archival Paper`,
        price: 17900.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524003.png?v=1716200536`,
        status: `available`
      },
      {
        title: `Niki McQueen - "Queer Flock" Mixed Media on Archival Paper`,
        price: 16200.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524002.png?v=1716200381`,
        status: `available`
      },
      {
        title: `Niki McQueen - "Whale Gazing" Mixed Media on Archival Paper`,
        price: 8750.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524001.png?v=1716200116`,
        status: `available`
      }
    ]
  },
  {
    id: `nicolaas-roos`,
    name: `Nicolaas Roos`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Landscapes`,
    bio: `Nicolaas Roos: A Harmonious Fusion of Mind and Canvas

Nicolaas Roos, an abstract expressionist, weaves a tapestry of inspiration drawn from Eastern philosophy, introspection, and diverse artistic experimentation. His paintings, described as lyrical, atmospheric, and ethereal yet serene, reflect a lifelong immersion in classical music and a profound connection to the sea as a passionate scuba diver.

Choosing large brushes over detailed realism, Roos explores the textured realms of paint, capturing a strong melancholic undertone in his work. His academic background in theology, philosophy, and clinical psychology, combined with a deep interest in sciences and history, forms the intellectual foundation of his creations.

Living mindfully, Roos infuses his daily routines with a non-judgmental awareness, allowing his paintings to speak eloquently without the need for excessive explanation. Each canvas, a harmonious blend of inner contemplation and artistic expression, invites viewers to revel in the beauty of the present moment.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/NR_Photo.jpg?v=1707985708`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/nicolaas-roos`,
    works: [
      {
        title: `Nicolaas Roos Oil on Stretched Canvas`,
        price: 25000.0,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NR0224001.png?v=1707986677`,
        status: `available`
      }
    ]
  },
  {
    id: `jeanne-pretorius`,
    name: `Jeanne Marais Pretorius`,
    url: `https://thewinelandsartgallery.com/collections/jeanne-marais-pretorius`,
    bio: `Jeanne Marais Pretorius: Crafting Life's Palette

Jeanne Marais, now Jeanne Pretorius, blossomed in a nurturing childhood, where the seeds of her remarkable talent were sown. Today, she stands as a dynamic, self-taught artist of boundless versatility.

Her artistry is a tapestry of exclusive and unique female figure studies, yet her prowess extends gracefully into various other themes. With a masterful command of color, she paints vibrant landscapes and cityscapes that pulse with dramatic intensity. For the past 13 years, she has wielded the brush and palette knife with finesse in her exploration of oils.

Jeanne's oeuvre has graced three remarkable solo exhibitions (2010, 2012, & 2015), and her works find homes in galleries across Pretoria, Hartebeespoort, Clarens, and beyond. Her international clientele bears testimony to the timeless allure of her creations.

Nestled in Centurion, South Africa, Jeanne shares her life with her husband Louis and their two daughters. In her own words, "The real advantage of my career as an artist is being in the fortunate position to do what I love for a living!" Her art embodies that love, enriching lives with every stroke of her brush.`,
    medium: `Oil`,
    style: `Landscapes`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/3_6.png?v=1695061361`,
    works: []
  }
];

// ─── BACKER MODEL ────────────────────────────────────────────────────
const MODELS = {
  S6:  { label: 'Standard',  term: 6,  vbPct: 0.50, colPct: 0.50 },
  E12: { label: 'Extended',  term: 12, vbPct: 0.50, colPct: 0.50 },
  P24: { label: 'Premium',   term: 24, vbPct: 0.50, colPct: 0.50 },
};

const calcBacking = (artworkValue, salePrice, modelKey, monthsPaid) => {
  const m = MODELS[modelKey];
  const fee = artworkValue * m.vbPct;
  const monthly = fee / m.term;
  const collected = monthly * monthsPaid;
  const balance = Math.max(0, fee - collected);
  const backerNet = Math.max(0, salePrice - balance);
  const backerProfit = backerNet - collected;
  const roi = collected > 0 ? (backerProfit / collected) * 100 : 0;
  const surplus = Math.max(0, salePrice - artworkValue);
  return { fee, monthly, collected, balance, backerNet, backerProfit, roi, surplus, salePrice };
};

// ─── STYLE HELPERS ───────────────────────────────────────────────────
const gF = "'Cormorant Garamond', Georgia, serif";
const sF = "'DM Sans', -apple-system, sans-serif";

// ─── GLOBAL CSS ──────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body{background:#1a2744;color:#e8edf5;font-family:${sF};}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:2px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
    .art-card{transition:transform 0.45s cubic-bezier(0.16,1,0.3,1),box-shadow 0.4s ease;cursor:pointer;}
    .art-card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 32px 64px rgba(26,39,68,0.6)!important;}
    .art-card:hover .art-img{transform:scale(1.06)!important;}
    .art-card:hover .art-overlay{opacity:1!important;}
    .art-img{transition:transform 0.6s cubic-bezier(0.16,1,0.3,1);}
    .art-overlay{transition:opacity 0.35s ease;}
    .artist-tile{transition:all 0.35s ease;cursor:pointer;}
    .artist-tile:hover{transform:translateY(-4px);}
    .nav-link{transition:color 0.2s ease,border-color 0.2s ease;}
    .tab-btn{transition:all 0.2s ease;}
    .gold-btn{transition:all 0.25s ease;}
    .gold-btn:hover{box-shadow:0 8px 24px rgba(184,144,44,0.4)!important;transform:translateY(-1px);}
    @media(max-width:768px){
      .desktop-only{display:none!important;}
      .mobile-stack{flex-direction:column!important;}
      .mobile-full{width:100%!important;}
    }
  `}</style>
);

// ─── NAV ─────────────────────────────────────────────────────────────
function Nav({ page, setPage }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(26,39,68,0.97)' : 'transparent',
      borderBottom: scrolled ? `1px solid ${C.goldBorder}` : '1px solid transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      transition: 'all 0.4s ease',
      padding: '0 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 72,
    }}>
      <div
        onClick={() => setPage('home')}
        style={{ fontFamily: gF, fontSize: 17, fontWeight: 300, letterSpacing: '0.18em', cursor: 'pointer', color: C.cream }}
      >
        THE WINELANDS <span style={{ color: C.gold }}>ART GALLERY</span>
      </div>

      <div className="desktop-only" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {[
          ['home', 'Home'],
          ['artists', 'Artists'],
          ['catalogue', 'Catalogue'],
          ['backing', 'Back an Artist'],
        ].map(([id, label]) => (
          <button
            key={id}
            className="nav-link"
            onClick={() => setPage(id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: sF, fontSize: 12, fontWeight: 500, letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: page === id ? C.gold : C.fog,
              borderBottom: page === id ? `1px solid ${C.gold}` : '1px solid transparent',
              paddingBottom: 2,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        className="gold-btn"
        onClick={() => setPage('backing')}
        style={{
          fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
          textTransform: 'uppercase', padding: '10px 22px',
          background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
          border: 'none', borderRadius: 4, color: '#1a2744', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(184,144,44,0.25)',
        }}
      >
        Become a Backer
      </button>
    </nav>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────
function HomePage({ setPage }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const featuredArtist = ARTISTS[0];
  const recentSales = ARTISTS.flatMap(a => a.works.filter(w => w.status === 'sold').map(w => ({ ...w, artist: a.name })));

  return (
    <div>
      {/* Hero */}
      <div style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${featuredArtist.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.25)',
          transform: 'scale(1.05)',
        }} />
        {/* Grain overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
        {/* Gold vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 80%, rgba(184,144,44,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(184,144,44,0.06) 0%, transparent 50%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px',
          animation: mounted ? 'fadeUp 1s ease both' : 'none',
        }}>
          <div style={{ fontSize: 11, letterSpacing: '0.45em', textTransform: 'uppercase', color: C.gold, marginBottom: 24, opacity: 0.9 }}>
            Fine Art · South African Masters
          </div>
          <h1 style={{
            fontFamily: gF, fontSize: 'clamp(52px, 10vw, 96px)', fontWeight: 300,
            letterSpacing: '0.06em', lineHeight: 1.05, color: C.cream, marginBottom: 32,
          }}>
            Back the Artists<br />
            <em style={{ fontStyle: 'italic', color: C.goldLight }}>Who Move You</em>
          </h1>
          <p style={{
            fontSize: 16, color: 'rgba(245,240,232,0.65)', lineHeight: 1.8, maxWidth: 560, margin: '0 auto 48px',
            fontWeight: 300,
          }}>
            A curated platform connecting art backers with South Africa's finest working artists. Display exceptional art. Share in the upside. Build a legacy.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="gold-btn" onClick={() => setPage('artists')} style={{
              fontFamily: sF, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '16px 36px',
              background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
              border: 'none', borderRadius: 4, color: '#1a2744', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(184,144,44,0.35)',
            }}>
              Meet the Artists
            </button>
            <button className="gold-btn" onClick={() => setPage('backing')} style={{
              fontFamily: sF, fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '16px 36px',
              background: 'transparent',
              border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.gold, cursor: 'pointer',
            }}>
              Calculate Earnings
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          animation: 'pulse 2s ease infinite',
        }}>
          <div style={{ width: 1, height: 48, background: `linear-gradient(to bottom, ${C.gold}, transparent)`, margin: '0 auto' }} />
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        background: C.inkMid,
        borderTop: `1px solid ${C.goldBorder}`, borderBottom: `1px solid ${C.goldBorder}`,
        padding: '32px 40px',
        display: 'flex', justifyContent: 'center', gap: 80, flexWrap: 'wrap',
      }}>
        {[
          ['26', 'South African Artists'],
          ['200+', 'Works Available'],
          ['50 / 50', 'Backer Share'],
          ['6 – 24mo', 'Display Terms'],
        ].map(([val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: gF, fontSize: 36, fontWeight: 300, color: C.gold, letterSpacing: '0.04em' }}>{val}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.fog, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Featured artists grid */}
      <div style={{ padding: '96px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Our Artists</div>
            <h2 style={{ fontFamily: gF, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em' }}>
              Masters of Their Craft
            </h2>
          </div>
          <button onClick={() => setPage('artists')} style={{
            background: 'none', border: `1px solid ${C.goldBorder}`, borderRadius: 4,
            color: C.gold, fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '12px 24px', cursor: 'pointer',
          }}>
            View All Artists →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {ARTISTS.slice(0, 6).map((artist, i) => (
            <div
              key={artist.id}
              className="artist-tile"
              onClick={() => setPage('artists')}
              style={{
                position: 'relative', overflow: 'hidden', borderRadius: 6,
                border: `1px solid ${C.goldBorder}`,
                animation: mounted ? `fadeUp 0.7s ${i * 0.1}s ease both` : 'none',
                opacity: mounted ? 1 : 0,
              }}
            >
              <div style={{ paddingBottom: '130%', position: 'relative', overflow: 'hidden', background: C.inkMid }}>
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="art-img"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(26,39,68,0.95) 0%, rgba(26,39,68,0.3) 50%, transparent 100%)',
                }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>
                    {artist.medium}
                  </div>
                  <div style={{ fontFamily: gF, fontSize: 22, fontWeight: 400, color: C.cream, letterSpacing: '0.02em' }}>
                    {artist.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.5)', marginTop: 4 }}>
                    {artist.works.length} works · {artist.works.filter(w => w.status === 'available').length} available
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How backing works */}
      <div style={{ background: C.inkMid, padding: '96px 40px', borderTop: `1px solid ${C.goldBorder}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>How It Works</div>
            <h2 style={{ fontFamily: gF, fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, color: C.cream }}>
              Art That Works for You
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 32 }}>
            {[
              { num: '01', title: 'Choose an Artist', body: 'Browse our curated roster of South African masters. Each profile includes full biography, available works, and sold history.' },
              { num: '02', title: 'Select a Work', body: 'Pick an artwork that moves you. The piece displays at a gallery partner location for the duration of your backing term.' },
              { num: '03', title: 'Earn Display Fees', body: 'Your artwork earns monthly display license fees — paid to you over 6, 12, or 24 months. 50% of the artwork value, structured to your term.' },
              { num: '04', title: 'Share the Sale', body: 'When the artwork sells, you receive your 50% share of the sale price. The calculator shows you exactly what to expect.' },
            ].map(step => (
              <div key={step.num} style={{ padding: '32px 28px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.goldGlow }}>
                <div style={{ fontFamily: gF, fontSize: 48, fontWeight: 300, color: C.gold, opacity: 0.5, marginBottom: 16, letterSpacing: '-0.02em' }}>
                  {step.num}
                </div>
                <h3 style={{ fontFamily: gF, fontSize: 22, fontWeight: 400, color: C.cream, marginBottom: 12 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: C.fog, lineHeight: 1.8 }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <button className="gold-btn" onClick={() => setPage('backing')} style={{
              fontFamily: sF, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '18px 44px', background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
              border: 'none', borderRadius: 4, color: '#1a2744', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(184,144,44,0.3)',
            }}>
              Open the Calculator
            </button>
          </div>
        </div>
      </div>

      {/* Recently sold */}
      {recentSales.length > 0 && (
        <div style={{ padding: '96px 40px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>Track Record</div>
            <h2 style={{ fontFamily: gF, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: C.cream }}>Recently Sold</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {recentSales.slice(0, 6).map((work, i) => (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, border: `1px solid ${C.goldBorder}` }}>
                <div style={{ paddingBottom: '100%', position: 'relative', background: C.inkMid }}>
                  <img src={work.image} alt={work.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,39,68,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', padding: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, background: C.greenDim, padding: '4px 10px', borderRadius: 3, marginBottom: 12, display: 'inline-block' }}>SOLD</div>
                      <div style={{ fontSize: 11, color: C.fog, marginBottom: 4 }}>{work.artist}</div>
                      <div style={{ fontFamily: gF, fontSize: 18, color: C.goldLight }}>R {fmt(work.price)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: C.inkMid, borderTop: `1px solid ${C.goldBorder}`, padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ fontFamily: gF, fontSize: 17, fontWeight: 300, letterSpacing: '0.18em', color: C.cream, marginBottom: 8 }}>
          THE WINELANDS <span style={{ color: C.gold }}>ART GALLERY</span>
        </div>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.fog, marginBottom: 24 }}>
          The Winelands Art Gallery · Hermanus, Western Cape
        </div>
        <div style={{ fontSize: 11, color: 'rgba(154,144,136,0.5)' }}>
          © {new Date().getFullYear()} The Winelands Art Gallery (Pty) Ltd · All artwork images © The Winelands Art Gallery
        </div>
      </footer>
    </div>
  );
}

// ─── ARTISTS PAGE ────────────────────────────────────────────────────
function ArtistsPage({ setSelectedArtist, setPage }) {
  const [search, setSearch] = useState('');
  const [mediumFilter, setMediumFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const mediums = ['all', ...new Set(ARTISTS.map(a => a.medium.split(' & ')[0].split(',')[0].trim()))];
  const filtered = ARTISTS.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.style.toLowerCase().includes(search.toLowerCase());
    const matchMedium = mediumFilter === 'all' || a.medium.includes(mediumFilter);
    return matchSearch && matchMedium;
  });

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {/* Header */}
      <div style={{ padding: '80px 40px 56px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Our Roster</div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 40 }}>
            The Artists
          </h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search artists or style…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 240, padding: '12px 18px',
                background: 'rgba(245,240,232,0.06)', border: `1px solid ${C.goldBorder}`,
                borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {mediums.slice(0, 5).map(m => (
                <button
                  key={m}
                  onClick={() => setMediumFilter(m)}
                  style={{
                    padding: '10px 18px', borderRadius: 4, fontFamily: sF, fontSize: 11,
                    fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                    background: mediumFilter === m ? `linear-gradient(135deg, ${C.gold}, #a07828)` : 'transparent',
                    border: mediumFilter === m ? 'none' : `1px solid ${C.goldBorder}`,
                    color: mediumFilter === m ? C.ink : C.gold,
                  }}
                >
                  {m === 'all' ? 'All' : m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '64px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {filtered.map((artist, i) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              delay={i * 0.07}
              mounted={mounted}
              onClick={() => { setSelectedArtist(artist); setPage('artist-detail'); }}
              onBacking={() => setPage('backing')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ArtistCard({ artist, delay, mounted, onClick, onBacking }) {
  const available = artist.works.filter(w => w.status === 'available');
  const sold = artist.works.filter(w => w.status === 'sold');
  const minPrice = Math.min(...artist.works.map(w => w.price));
  const maxPrice = Math.max(...artist.works.map(w => w.price));

  return (
    <div
      style={{
        background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 6,
        overflow: 'hidden',
        animation: mounted ? `fadeUp 0.7s ${delay}s ease both` : 'none',
        opacity: mounted ? 1 : 0,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Artist image */}
      <div
        className="art-card"
        onClick={onClick}
        style={{ position: 'relative', paddingBottom: '65%', overflow: 'hidden', background: '#0e1628' }}
      >
        <img
          className="art-img"
          src={artist.image}
          alt={artist.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="art-overlay" style={{
          position: 'absolute', inset: 0, opacity: 0,
          background: 'linear-gradient(to top, rgba(26,39,68,0.9), rgba(26,39,68,0.2))',
          display: 'flex', alignItems: 'flex-end', padding: 20,
        }}>
          <span style={{ fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold }}>
            View Portfolio →
          </span>
        </div>
        {/* Born badge */}
        {artist.born && (
          <div style={{
            position: 'absolute', top: 16, left: 16,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.gold, background: 'rgba(26,39,68,0.85)', padding: '4px 10px', borderRadius: 3,
            border: `1px solid ${C.goldBorder}`,
          }}>
            b. {artist.born}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '24px 24px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
          {artist.medium}
        </div>
        <h3
          onClick={onClick}
          style={{ fontFamily: gF, fontSize: 26, fontWeight: 400, color: C.cream, marginBottom: 8, cursor: 'pointer', letterSpacing: '0.02em' }}
        >
          {artist.name}
        </h3>
        <div style={{ fontSize: 11, color: C.fog, marginBottom: 16, lineHeight: 1.6 }}>{artist.style}</div>

        <p style={{ fontSize: 12, color: 'rgba(154,144,136,0.8)', lineHeight: 1.75, flex: 1, marginBottom: 20 }}>
          {artist.bio.slice(0, 160)}…
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12, marginBottom: 20, padding: '16px 0',
          borderTop: `1px solid ${C.goldBorder}`, borderBottom: `1px solid ${C.goldBorder}`,
        }}>
          {[
            [available.length, 'Available'],
            [sold.length, 'Sold'],
            [`R${fmt(minPrice)}`, 'From'],
          ].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: gF, fontSize: 20, fontWeight: 400, color: C.gold }}>{val}</div>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClick}
            style={{
              flex: 1, padding: '11px 0', background: 'transparent',
              border: `1px solid ${C.goldBorder}`, borderRadius: 4,
              color: C.gold, fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Full Profile
          </button>
          <button
            className="gold-btn"
            onClick={onBacking}
            style={{
              flex: 1, padding: '11px 0',
              background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
              border: 'none', borderRadius: 4,
              color: C.ink, fontFamily: sF, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Back Artist
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ARTIST DETAIL ───────────────────────────────────────────────────
function ArtistDetail({ artist, setPage }) {
  const [lightbox, setLightbox] = useState(null);
  const [tab, setTab] = useState('available');
  if (!artist) { setPage('artists'); return null; }

  const available = artist.works.filter(w => w.status === 'available');
  const sold = artist.works.filter(w => w.status === 'sold');
  const shown = tab === 'available' ? available : sold;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(10,16,32,0.96)', zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 24, right: 28, background: 'none', border: 'none',
            color: C.fog, fontSize: 36, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '100%', textAlign: 'center' }}>
            <img src={lightbox.image} alt={lightbox.title} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 4 }} />
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: gF, fontSize: 22, color: C.cream, marginBottom: 8 }}>{lightbox.title}</div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', fontSize: 13 }}>
                <span style={{ color: C.gold, fontFamily: gF, fontSize: 24 }}>R {fmt(lightbox.price)}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                  padding: '4px 12px', borderRadius: 3,
                  background: lightbox.status === 'sold' ? C.greenDim : C.goldDim,
                  color: lightbox.status === 'sold' ? C.green : C.gold,
                  alignSelf: 'center',
                }}>
                  {lightbox.status === 'sold' ? 'Sold' : 'Available'}
                </span>
              </div>
              {lightbox.status === 'available' && (
                <button
                  className="gold-btn"
                  onClick={() => setPage('backing')}
                  style={{
                    marginTop: 20, fontFamily: sF, fontSize: 12, fontWeight: 600, letterSpacing: '0.14em',
                    textTransform: 'uppercase', padding: '14px 32px',
                    background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
                    border: 'none', borderRadius: 4, color: '#1a2744', cursor: 'pointer',
                  }}
                >
                  Back This Artwork
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{
        position: 'relative', minHeight: 480, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end',
        background: C.inkMid, borderBottom: `1px solid ${C.goldBorder}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${artist.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          filter: 'brightness(0.2)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(14,12,9,1) 0%, rgba(26,39,68,0.4) 60%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 56px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => setPage('artists')}
            style={{ background: 'none', border: 'none', color: C.fog, fontFamily: sF, fontSize: 12, cursor: 'pointer', marginBottom: 24, letterSpacing: '0.1em' }}
          >
            ← All Artists
          </button>
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{
              width: 120, height: 120, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${C.gold}`, boxShadow: `0 0 40px rgba(184,144,44,0.3)`,
            }}>
              <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 10 }}>
                {artist.medium} · {artist.birthplace}
              </div>
              <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 12 }}>
                {artist.name}
              </h1>
              <div style={{ fontSize: 12, color: C.fog, letterSpacing: '0.05em' }}>{artist.style}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '64px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 64, alignItems: 'start' }}>

          {/* Bio + works */}
          <div>
            {/* Biography */}
            <div style={{ marginBottom: 64 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 24 }}>Biography</div>
              {artist.bio.split('\n\n').map((para, i) => (
                <p key={i} style={{ fontSize: 15, color: 'rgba(245,240,232,0.75)', lineHeight: 1.9, marginBottom: 20, fontWeight: 300 }}>
                  {para}
                </p>
              ))}
            </div>

            {/* Works */}
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 32, borderBottom: `1px solid ${C.goldBorder}`, paddingBottom: 16 }}>
                {[['available', `Available (${available.length})`], ['sold', `Sold (${sold.length})`]].map(([id, label]) => (
                  <button
                    key={id}
                    className="tab-btn"
                    onClick={() => setTab(id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: sF, fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: tab === id ? C.gold : C.fog,
                      borderBottom: tab === id ? `2px solid ${C.gold}` : '2px solid transparent',
                      paddingBottom: 8,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {shown.map((work, i) => (
                  <div
                    key={i}
                    className="art-card"
                    onClick={() => setLightbox(work)}
                    style={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.goldBorder}`, background: C.inkMid }}
                  >
                    <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden' }}>
                      <img
                        className="art-img"
                        src={work.image}
                        alt={work.title}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: work.status === 'sold' ? 0.55 : 1 }}
                      />
                      <div className="art-overlay" style={{
                        position: 'absolute', inset: 0, opacity: 0,
                        background: 'rgba(26,39,68,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold }}>
                          {work.status === 'sold' ? 'View Details' : 'Back This Work'}
                        </span>
                      </div>
                      {work.status === 'sold' && (
                        <div style={{
                          position: 'absolute', top: 12, right: 12,
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                          color: C.green, background: C.greenDim, border: `1px solid rgba(61,122,86,0.4)`,
                          padding: '3px 8px', borderRadius: 3,
                        }}>Sold</div>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ fontFamily: gF, fontSize: 14, color: C.cream, marginBottom: 4, lineHeight: 1.3 }}>{work.title}</div>
                      <div style={{ fontFamily: gF, fontSize: 18, color: C.gold }}>R {fmt(work.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Backer summary */}
          <div style={{ position: 'sticky', top: 100 }}>
            <div style={{
              border: `1px solid ${C.goldBorder}`, borderRadius: 6, overflow: 'hidden',
              background: C.inkMid,
            }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
              <div style={{ padding: 28 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
                  Backer Snapshot
                </div>
                <div style={{ fontFamily: gF, fontSize: 22, color: C.cream, marginBottom: 24 }}>
                  Back {artist.name.split(' ')[0]}
                </div>

                {available.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                      {[
                        ['Works Available', available.length],
                        ['Sold to Date', sold.length],
                        ['From', `R ${fmt(Math.min(...artist.works.map(w => w.price)))}`],
                        ['Up to', `R ${fmt(Math.max(...artist.works.map(w => w.price)))}`],
                      ].map(([label, val]) => (
                        <div key={label} style={{ padding: '14px 12px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4 }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 6 }}>{label}</div>
                          <div style={{ fontFamily: gF, fontSize: 20, color: C.gold }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Quick calc for cheapest available */}
                    {(() => {
                      const cheapest = available.reduce((a, b) => a.price < b.price ? a : b);
                      const deal = calcBacking(cheapest.price, cheapest.price * 1.1, 'E12', 12);
                      return (
                        <div style={{ padding: '16px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, marginBottom: 20 }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 10 }}>
                            12-Month Backing · R {fmt(cheapest.price)} work
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                            <span style={{ color: C.fog }}>Monthly fee</span>
                            <span style={{ color: C.gold }}>R {fmt(deal.monthly)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                            <span style={{ color: C.fog }}>Total collected</span>
                            <span style={{ color: C.gold }}>R {fmt(deal.collected)}</span>
                          </div>
                          <div style={{ height: 1, background: C.goldBorder, margin: '10px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: C.fog, fontWeight: 600 }}>Your share at sale</span>
                            <span style={{ color: C.green, fontFamily: gF, fontSize: 18 }}>R {fmt(deal.backerNet)}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      className="gold-btn"
                      onClick={() => setPage('backing')}
                      style={{
                        width: '100%', padding: '16px',
                        background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
                        border: 'none', borderRadius: 4, color: C.ink, fontFamily: sF,
                        fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Open Full Calculator
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: C.fog, textAlign: 'center', padding: '20px 0' }}>
                    All works currently sold — new works coming soon.
                  </div>
                )}
              </div>
            </div>

            {/* Gallery link */}
            <a
              href={artist.galleryUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block', marginTop: 12, padding: '12px 20px', textAlign: 'center',
                border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                color: C.fog, fontFamily: sF, fontSize: 11, letterSpacing: '0.1em',
                textDecoration: 'none', transition: 'color 0.2s',
              }}
            >
              View on The Winelands Art Gallery ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CATALOGUE ───────────────────────────────────────────────────────
function CataloguePage({ setPage }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const allWorks = ARTISTS.flatMap(a => a.works.map(w => ({ ...w, artistName: a.name, artistId: a.id })));
  const filtered = allWorks.filter(w => {
    const matchFilter = filter === 'all' || w.status === filter;
    const matchSearch = !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.artistName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(10,16,32,0.97)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
          animation: 'fadeIn 0.3s ease',
        }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 24, right: 28, background: 'none', border: 'none', color: C.fog, fontSize: 36, cursor: 'pointer' }}>×</button>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 820, width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <img src={lightbox.image} alt={lightbox.title} style={{ width: '100%', borderRadius: 4, opacity: lightbox.status === 'sold' ? 0.7 : 1 }} />
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>
                  {lightbox.artistName}
                </div>
                <div style={{ fontFamily: gF, fontSize: 28, color: C.cream, marginBottom: 20, lineHeight: 1.3 }}>{lightbox.title}</div>
                <div style={{ fontFamily: gF, fontSize: 36, color: C.gold, marginBottom: 24 }}>R {fmt(lightbox.price)}</div>
                <div style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 3, marginBottom: 32,
                  background: lightbox.status === 'sold' ? C.greenDim : C.goldDim,
                  color: lightbox.status === 'sold' ? C.green : C.gold,
                  border: `1px solid ${lightbox.status === 'sold' ? 'rgba(61,122,86,0.4)' : C.goldBorder}`,
                }}>
                  {lightbox.status === 'sold' ? '✓ Sold' : 'Available for Backing'}
                </div>
                {lightbox.status === 'available' && (
                  <div>
                    {/* Quick backing calc */}
                    <div style={{ padding: 16, background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, marginBottom: 20 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 12 }}>12-Month Backing Preview</div>
                      {(() => {
                        const d = calcBacking(lightbox.price, lightbox.price, 'E12', 12);
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                              <span style={{ color: C.fog }}>Monthly fee</span>
                              <span style={{ color: C.gold }}>R {fmt(d.monthly)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: C.fog }}>Your share at face value sale</span>
                              <span style={{ color: C.green, fontFamily: gF, fontSize: 16 }}>R {fmt(d.backerNet)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button className="gold-btn" onClick={() => setPage('backing')} style={{
                      width: '100%', padding: '14px',
                      background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
                      border: 'none', borderRadius: 4, color: C.ink, fontFamily: sF,
                      fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                    }}>
                      Open Full Calculator
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '80px 40px 48px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Full Collection</div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 36 }}>
            The Catalogue
          </h1>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search by title or artist…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, minWidth: 240, padding: '12px 18px',
                background: 'rgba(245,240,232,0.06)', border: `1px solid ${C.goldBorder}`,
                borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none',
              }}
            />
            {[['all', `All (${allWorks.length})`], ['available', `Available (${allWorks.filter(w => w.status === 'available').length})`], ['sold', `Sold (${allWorks.filter(w => w.status === 'sold').length})`]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: '10px 20px', borderRadius: 4, fontFamily: sF, fontSize: 11,
                  fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                  background: filter === id ? `linear-gradient(135deg, ${C.gold}, #a07828)` : 'transparent',
                  border: filter === id ? 'none' : `1px solid ${C.goldBorder}`,
                  color: filter === id ? C.ink : C.gold,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry-style grid */}
      <div style={{ padding: '56px 40px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ columns: '240px', columnGap: 20 }}>
          {filtered.map((work, i) => (
            <div
              key={`${work.artistId}-${i}`}
              className="art-card"
              onClick={() => setLightbox(work)}
              style={{
                breakInside: 'avoid', marginBottom: 20, position: 'relative',
                borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.goldBorder}`,
                background: C.inkMid,
                animation: mounted ? `fadeUp 0.5s ${(i % 12) * 0.04}s ease both` : 'none',
                opacity: mounted ? 1 : 0,
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  className="art-img"
                  src={work.image}
                  alt={work.title}
                  style={{ width: '100%', display: 'block', opacity: work.status === 'sold' ? 0.5 : 1 }}
                />
                <div className="art-overlay" style={{
                  position: 'absolute', inset: 0, opacity: 0,
                  background: 'rgba(26,39,68,0.65)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold }}>
                    {work.status === 'sold' ? 'View' : 'Back This Work'}
                  </span>
                </div>
                {work.status === 'sold' && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: C.green, background: 'rgba(26,39,68,0.9)', border: `1px solid rgba(61,122,86,0.5)`,
                    padding: '3px 8px', borderRadius: 3,
                  }}>Sold</div>
                )}
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>
                  {work.artistName}
                </div>
                <div style={{ fontFamily: gF, fontSize: 14, color: C.cream, marginBottom: 6, lineHeight: 1.3 }}>
                  {work.title}
                </div>
                <div style={{ fontFamily: gF, fontSize: 20, color: work.status === 'sold' ? C.green : C.gold }}>
                  R {fmt(work.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: C.fog }}>
            <div style={{ fontFamily: gF, fontSize: 48, opacity: 0.2, marginBottom: 16 }}>◆</div>
            <div style={{ fontSize: 14 }}>No works match your search.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BACKING / CALCULATOR ────────────────────────────────────────────
function BackingPage() {
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedWork, setSelectedWork] = useState('');
  const [modelKey, setModelKey] = useState('E12');
  const [artVal, setArtVal] = useState('');
  const [saleVal, setSaleVal] = useState('');
  const [monthsSold, setMonthsSold] = useState('');
  const [mode, setMode] = useState('manual');

  const artist = ARTISTS.find(a => a.id === selectedArtist);
  const work = artist?.works.find((w, i) => String(i) === selectedWork);

  useEffect(() => {
    if (work) { setArtVal(String(work.price)); setSaleVal(''); setMonthsSold(''); }
  }, [selectedWork]);

  const av = parseFloat(artVal) || 0;
  const sp = parseFloat(saleVal) || av;
  const m = MODELS[modelKey];
  const mo = Math.max(1, Math.min(parseInt(monthsSold) || m.term, m.term));
  const deal = av > 0 ? calcBacking(av, sp, modelKey, mo) : null;
  const scenarios = av > 0 ? Array.from({ length: m.term }, (_, i) => ({ month: i + 1, ...calcBacking(av, sp, modelKey, i + 1) })) : [];

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>
      {/* Header */}
      <div style={{ padding: '80px 40px 56px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Backer Tools</div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 16 }}>
            The Backing Calculator
          </h1>
          <p style={{ fontSize: 15, color: C.fog, lineHeight: 1.7, maxWidth: 640, fontWeight: 300 }}>
            Model your earnings before you commit. Select an artwork, choose your term, and see exactly what you stand to earn from display fees and sale proceeds.
          </p>
        </div>
      </div>

      <div style={{ padding: '64px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 48, alignItems: 'start' }}>

          {/* Inputs */}
          <div>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 4, padding: 4 }}>
              {[['manual', 'Manual Entry'], ['lookup', 'Choose from Gallery']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 3, fontFamily: sF,
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', border: 'none',
                    background: mode === id ? `linear-gradient(135deg, ${C.gold}, #a07828)` : 'transparent',
                    color: mode === id ? C.ink : C.fog,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'lookup' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                  Artist
                </label>
                <select
                  value={selectedArtist}
                  onChange={e => { setSelectedArtist(e.target.value); setSelectedWork(''); setArtVal(''); }}
                  style={{
                    width: '100%', padding: '13px 16px', background: C.inkMid,
                    border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                    color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none', cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="">— Select an artist</option>
                  {ARTISTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>

                {artist && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                      Artwork
                    </label>
                    <select
                      value={selectedWork}
                      onChange={e => setSelectedWork(e.target.value)}
                      style={{
                        width: '100%', padding: '13px 16px', background: C.inkMid,
                        border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                        color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none', cursor: 'pointer',
                        appearance: 'none',
                      }}
                    >
                      <option value="">— Select a work</option>
                      {artist.works.filter(w => w.status === 'available').map((w, i) => (
                        <option key={i} value={String(i)}>{w.title} — R {fmt(w.price)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Term selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
                Backing Term
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {Object.entries(MODELS).map(([key, mod]) => (
                  <button
                    key={key}
                    onClick={() => { setModelKey(key); setMonthsSold(''); }}
                    style={{
                      padding: '14px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: sF,
                      textAlign: 'center', border: modelKey === key ? 'none' : `1px solid ${C.goldBorder}`,
                      background: modelKey === key ? `linear-gradient(135deg, ${C.gold}, #a07828)` : C.inkMid,
                      color: modelKey === key ? C.ink : C.fog,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{mod.label}</div>
                    <div style={{ fontSize: 9, letterSpacing: '0.1em', opacity: 0.75 }}>{mod.term} months</div>
                    {av > 0 && (
                      <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>
                        R {fmt((av * mod.vbPct) / mod.term)}/mo
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Artwork value */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Artwork Value (R)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.inkMid }}>
                <span style={{ padding: '0 14px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 48, display: 'flex', alignItems: 'center', fontSize: 14 }}>R</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={artVal}
                  onChange={e => setArtVal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 15000"
                  style={{
                    flex: 1, padding: '0 16px', height: 48, background: 'transparent',
                    border: 'none', color: C.cream, fontFamily: sF, fontSize: 16, outline: 'none', textAlign: 'right',
                  }}
                />
              </div>
            </div>

            {/* Sale price */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Expected Sale Price (R) <span style={{ color: C.fog, fontWeight: 400 }}>optional</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.inkMid }}>
                <span style={{ padding: '0 14px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 48, display: 'flex', alignItems: 'center', fontSize: 14 }}>R</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={saleVal}
                  onChange={e => setSaleVal(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder={artVal || 'same as artwork value'}
                  style={{
                    flex: 1, padding: '0 16px', height: 48, background: 'transparent',
                    border: 'none', color: C.cream, fontFamily: sF, fontSize: 16, outline: 'none', textAlign: 'right',
                  }}
                />
              </div>
            </div>

            {/* Month sold */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                Month Sold (1 – {m.term})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={monthsSold}
                onChange={e => setMonthsSold(e.target.value)}
                onBlur={e => setMonthsSold(String(Math.max(1, Math.min(parseInt(e.target.value) || m.term, m.term))))}
                placeholder={String(m.term)}
                style={{
                  width: '100%', padding: '13px 16px', background: C.inkMid,
                  border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                  color: C.cream, fontFamily: sF, fontSize: 15, outline: 'none', textAlign: 'right',
                }}
              />
            </div>

            {/* FAIS disclaimer */}
            <div style={{ padding: '14px 16px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, fontSize: 11, color: C.fog, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>FAIS Note:</strong> This is a display license arrangement. Backers acquire artworks for display — not investments. All figures are illustrative and subject to actual sale outcomes.
            </div>
          </div>

          {/* Results */}
          <div>
            {!deal ? (
              <div style={{ textAlign: 'center', padding: '80px 40px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid }}>
                <div style={{ fontFamily: gF, fontSize: 56, color: C.gold, opacity: 0.2, marginBottom: 16 }}>◆</div>
                <div style={{ fontFamily: gF, fontSize: 24, color: C.fog, fontWeight: 300 }}>Enter an artwork value to begin</div>
              </div>
            ) : (
              <>
                {/* Hero result cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Your Monthly Fee', val: `R ${fmt(deal.monthly)}`, sub: `× ${m.term} months`, color: C.gold },
                    { label: 'Total Collected', val: `R ${fmt(deal.collected)}`, sub: `by month ${mo}`, color: C.goldLight },
                    { label: 'Your Sale Share', val: `R ${fmt(deal.backerNet)}`, sub: deal.backerProfit >= 0 ? `+R ${fmt(deal.backerProfit)} profit` : `−R ${fmt(Math.abs(deal.backerProfit))}`, color: deal.backerProfit >= 0 ? '#3d9e6a' : C.red },
                  ].map(card => (
                    <div key={card.label} style={{ padding: '24px 20px', border: `1px solid ${C.goldBorder}`, borderRadius: 4, background: C.inkMid, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.fog, marginBottom: 12 }}>{card.label}</div>
                      <div style={{ fontFamily: gF, fontSize: 28, fontWeight: 400, color: card.color, marginBottom: 6 }}>{card.val}</div>
                      <div style={{ fontSize: 10, color: C.fog }}>{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 4, background: C.inkMid, overflow: 'hidden', marginBottom: 24 }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.goldBorder}` }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold }}>
                      Deal Breakdown — {m.label} · Month {mo}
                    </div>
                  </div>
                  <div style={{ padding: '20px 24px' }}>
                    {[
                      ['Artwork value', `R ${fmt(av)}`, false],
                      ['Gallery commission (50%)', `R ${fmt(deal.fee)}`, false],
                      ['Monthly fee', `R ${fmt(deal.monthly)}`, false],
                      [`${mo} months collected`, `R ${fmt(deal.collected)}`, false],
                      ['Balance at sale', `−R ${fmt(deal.balance)}`, true],
                      null,
                      ['Your share at sale', `R ${fmt(deal.backerNet)}`, false, true, '#3d9e6a'],
                      ['Your profit', `R ${fmt(deal.backerProfit)}`, false, true, deal.backerProfit >= 0 ? '#3d9e6a' : C.red],
                      ['ROI', `${fmtDec(deal.roi)}%`, false, true, deal.roi >= 0 ? '#3d9e6a' : C.red],
                      deal.surplus > 0 ? ['Surplus above value', `R ${fmt(deal.surplus)}`, false, true, '#3d9e6a'] : null,
                    ].filter(Boolean).map((row, i) => {
                      if (row === null) return <div key={i} style={{ height: 1, background: C.goldBorder, margin: '12px 0' }} />;
                      const [label, val, dim, bold, color] = row;
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid rgba(184,144,44,0.08)` }}>
                          <span style={{ fontSize: 13, color: dim ? C.red : C.fog }}>{label}</span>
                          <span style={{ fontFamily: bold ? gF : sF, fontSize: bold ? 18 : 13, fontWeight: bold ? 400 : 500, color: color || (dim ? C.red : C.gold) }}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scenario table */}
                <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 4, background: C.inkMid, overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.goldBorder}` }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold }}>
                      All Scenarios — {m.label}
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Month', 'Collected', 'Balance', 'Your Share', 'Profit', 'ROI'].map((h, i) => (
                            <th key={h} style={{
                              padding: '10px 14px', textAlign: i > 0 ? 'right' : 'left',
                              fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
                              color: C.fog, borderBottom: `1px solid ${C.goldBorder}`,
                              background: C.inkMid, position: 'sticky', top: 0,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scenarios.map(s => {
                          const isSelected = s.month === mo;
                          return (
                            <tr
                              key={s.month}
                              style={{ background: isSelected ? C.goldDim : 'transparent', cursor: 'pointer' }}
                              onClick={() => setMonthsSold(String(s.month))}
                            >
                              <td style={{ padding: '10px 14px', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: isSelected ? C.gold : C.cream, fontWeight: isSelected ? 600 : 400 }}>
                                Mo {s.month}{isSelected ? ' ◆' : ''}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: C.fog }}>R {fmt(s.collected)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: s.balance > 0 ? C.red : '#3d9e6a' }}>R {fmt(s.balance)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: '#3d9e6a', fontWeight: 600 }}>R {fmt(s.backerNet)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: s.backerProfit >= 0 ? '#3d9e6a' : C.red }}>R {fmt(s.backerProfit)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', borderBottom: `1px solid rgba(184,144,44,0.08)`, color: C.gold, fontWeight: 600 }}>{fmtDec(s.roi)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────
export default function WinelandsBackers() {
  const [page, setPage] = useState('home');
  const [selectedArtist, setSelectedArtist] = useState(null);

  const navigateTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={navigateTo} />
      {page === 'home' && <HomePage setPage={navigateTo} />}
      {page === 'artists' && <ArtistsPage setSelectedArtist={setSelectedArtist} setPage={navigateTo} />}
      {page === 'artist-detail' && <ArtistDetail artist={selectedArtist} setPage={navigateTo} />}
      {page === 'catalogue' && <CataloguePage setPage={navigateTo} />}
      {page === 'backing' && <BackingPage />}
    </>
  );
}
