'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const artKey = (artistId, title) => `${artistId}|${title}`;

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

// ─── ARTIST DATA (scraped primary + CSV secondary, no mockups)
const ARTISTS = [
  {
    id: `thomas-kohler`,
    name: `Thomas Kohler`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Maritime, Landscapes`,
    bio: `Thomas Kohler: Where Sea, Memory, and Canvas Meet

Born in 1964 in Cape Town, Thomas Kohler spent part of his youth in Germany after his family left South Africa during the unsettled years of the 1970s. Educated in Cologne as a graphic designer, he returned home in 1988 and spent nearly two decades in the fast-paced world of advertising. In 2004, seeking a quieter and more meaningful rhythm, he turned fully to painting.

The sea has long shaped Kohler’s imagination. Ships run deep in his family’s history—his great-grandfather built them, his father sailed them, and family voyages across the Atlantic left lasting impressions. Living in Grotto Bay on the West Coast, he draws daily inspiration from the Atlantic Ocean, striving to capture its shifting light, moods, and power.

Thomas also paints people, drawn to the subtle drama of human interaction. A self-described traditionalist with a quirky edge, he paints largely for private collectors, preserving memories of places, families, and the enduring pull of the sea.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/10_2_7d87a03a-e3ef-4f25-9d07-0ca715954ef4.png?v=1774946216`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/thomas-kohler-art`,
    statsAvailable: 6,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2021 Winter Storm"`,
        price: 6750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/TK0224008.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/TK0224008.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224008.png?v=1707989018`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK02240082021WinterStormGrottoBay54x40copy.jpg?v=1707989019`
        ],
        variants: [
          {
            label: `Thomas Kohler Oil on Stretched Canvas "2021 Winter Storm"`,
            price: 6750
          }
]
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2022 Danneborg "`,
        price: 9500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/TK0224007.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/TK0224007.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224007.png?v=1707988926`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK02240072022Danneborg56x38copy.jpg?v=1707988926`
        ],
        variants: [
          {
            label: `Thomas Kohler Oil on Stretched Canvas "2022 Danneborg "`,
            price: 9500
          }
]
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2019 Autumn"`,
        price: 6500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/TK0224004.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/TK0224004.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224004.png?v=1707988552`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK02240042019Autumn54x400copy.jpg?v=1707988553`
        ],
        variants: [
          {
            label: `Thomas Kohler Oil on Stretched Canvas "2019 Autumn"`,
            price: 6500
          }
]
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2017 Sydney Harbour"`,
        price: 8950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/TK0224003.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/TK0224003.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224003.png?v=1707988455`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK02240032017SydneyHarbour51x61copy.jpg?v=1707988455`
        ],
        variants: [
          {
            label: `Thomas Kohler Oil on Stretched Canvas "2017 Sydney Harbour"`,
            price: 8950
          }
]
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2017 Public Transport in Norway "`,
        price: 8500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/TK0224002.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/TK0224002.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224002.png?v=1707988340`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK02240022017PublicTransportinNorway455x605copy.jpg?v=1707988340`
        ],
        variants: [
          {
            label: `Thomas Kohler Oil on Stretched Canvas "2017 Public Transport in Norway "`,
            price: 8500
          }
]
      },
      {
        title: `Thomas Kohler Oil on Stretched Canvas "2007 Rounding Lighthouse"`,
        price: 13500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/TK0224001.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/TK0224001.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK0224001.png?v=1707988066`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/TK02240012007RoundingLighthouse61x76copy.jpg?v=1707988066`
        ],
        variants: [
          {
            label: `Thomas Kohler Oil on Stretched Canvas "2007 Rounding Lighthouse"`,
            price: 13500
          }
]
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
    statsAvailable: 5,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Many Parts To Each Of Us by AJ Burns`,
        price: 5500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AJB02260071.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AJB02260071.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260072.png?v=1771842480`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB0226007AJBurnsManypartstoeachofus60x40cmcopy.jpg?v=1771842480`
        ],
        variants: [{ label: `Many Parts To Each Of Us by AJ Burns`, price: 5500 }]
      },
      {
        title: `Fiery Redheads by AJ Burns`,
        price: 5500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AJB02260061.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AJB02260061.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260062.png?v=1771842397`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB0226006AJBurnsFieryRedheads60x40cm3copy.jpg?v=1771842397`
        ],
        variants: [{ label: `Fiery Redheads by AJ Burns`, price: 5500 }]
      },
      {
        title: `Close but different by AJ Burns`,
        price: 5500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AJB02260041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AJB02260041.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB02260042.png?v=1771842248`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB0226004AJBurnsClosebutDifferent60x40cmcopy.jpg?v=1771842248`
        ],
        variants: [{ label: `Close but different by AJ Burns`, price: 5500 }]
      },
      {
        title: `A Little Left of Centre by AJ Burns`,
        price: 21500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AJB1025007AJBurnsALittleLeftofCentre120x74cm1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AJB1025007AJBurnsALittleLeftofCentre120x74cm1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025007AJBurnsALittleLeftofCentre120x74cm2.png?v=1761295746`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025007AJBurnsALittleLeftofCentre120x74cm3.jpg?v=1761295747`
        ],
        variants: [{ label: `A Little Left of Centre by AJ Burns`, price: 21500 }]
      },
      {
        title: `Keep Exploring by AJ Burns`,
        price: 15400,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AJB1025004AJBurnsKeepExploring90x70cm1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AJB1025004AJBurnsKeepExploring90x70cm1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025004AJBurnsKeepExploring90x70cm2.png?v=1761295443`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AJB1025004AJBurnsKeepExploring90x70cm3.jpg?v=1761295443`
        ],
        variants: [{ label: `Keep Exploring by AJ Burns`, price: 15400 }]
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
    statsAvailable: 5,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Paul van Rensburg - Exclusive USA Series #1`,
        price: 74497,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260061.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260061.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260062.png?v=1773316369`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260063.png?v=1773316369`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR03260061270mmx1010mmcopy.jpg?v=1773316368`
        ],
        variants: [{ label: `Paul van Rensburg - Exclusive USA Series #1 (1270mm x 1010mm)`, price: 74497 }]
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 16500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260051.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260051.png`
        ],
        variants: [{ label: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`, price: 16500 }]
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 16500,
        status: `available`,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425012.png?v=1744871692`,
        images: [
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425012.png?v=1744871692`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425012x.png?v=1744871693`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425012y.png?v=1744871692`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR0425012copy.jpg?v=1744871692`
        ],
        variants: [{ label: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`, price: 16500 }]
      },
      {
        title: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`,
        price: 16500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR0126031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR0126031.png`
        ],
        variants: [{ label: `Paul van Rensburg - Acrylic on Stretched Canvas 1270mm x 1010mm`, price: 16500 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260041.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260171.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260171.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260172.png?v=1771592093`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260173850mmx600mmcopy.jpg?v=1771592093`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260021.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR03260011.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260351.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260351.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260321.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260321.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260211.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260211.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 850mm x 600mm`,
        price: 5750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260201_76ec930c-7a0f-4db6-8462-cd26cf3b3704.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260201_76ec930c-7a0f-4db6-8462-cd26cf3b3704.png`
        ],
        variants: [{ label: `Paul van Rensburg - 850mm x 600mm`, price: 5750 }]
      },
      {
        title: `Paul van Rensburg - 1270mm x 1010mm`,
        price: 28500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260291.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260291.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260292.png?v=1771592585`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR012602931270mmx1010mmcopy.jpg?v=1771592585`
        ],
        variants: [{ label: `Paul van Rensburg - 1270mm x 1010mm`, price: 28500 }]
      },
      {
        title: `Paul van Rensburg - 1200mm x 600mm`,
        price: 8950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260281.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/PVR01260281.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260282.png?v=1771592490`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR01260283.png?v=1771592491`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/PVR012602841200x600copy.jpg?v=1771592490`
        ],
        variants: [{ label: `Paul van Rensburg - 1200mm x 600mm`, price: 8950 }]
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
    statsAvailable: 4,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE0526002_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE0526002_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE03260011.png?v=1777556092`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE03260012.png?v=1777556092`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE03260013.jpg?v=1777556092`
        ],
        variants: [{ label: `Harry Erasmus - 760mm x 380mm`, price: 10950 }]
      },
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE03260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE03260021.png`
        ],
        variants: [{ label: `Harry Erasmus - 760mm x 380mm`, price: 10950 }]
      },
      {
        title: `Harry Erasmus - 760mm x 380mm`,
        price: 10950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE03260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE03260011.png`
        ],
        variants: [{ label: `Harry Erasmus - 760mm x 380mm`, price: 10950 }]
      },
      {
        title: `Harry Erasmus - 410mm x 200mm`,
        price: 4750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE02260031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE02260031.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260031.png?v=1777555988`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260032.png?v=1777555988`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE0226003410mmx200mmcopy.jpg?v=1777555987`
        ],
        variants: [{ label: `Harry Erasmus - 410mm x 200mm`, price: 4750 }]
      },
      {
        title: `Harry Erasmus - 350mm x 250mm`,
        price: 2750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE02260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE02260021.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260011.png?v=1771590659`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260012.png?v=1771590659`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE02260013.jpg?v=1771590659`
        ],
        variants: [{ label: `Harry Erasmus - 350mm x 250mm`, price: 2750 }]
      },
      {
        title: `Harry Erasmus - 1600mm x 600mm`,
        price: 19500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE09250041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE09250041.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250011.png?v=1758525953`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250012.png?v=1758525953`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250013.png?v=1758525953`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/HE09250014.jpg?v=1758525953`
        ],
        variants: [{ label: `Harry Erasmus - 1600mm x 600mm`, price: 19500 }]
      },
      {
        title: `Harry Erasmus - 1600mm x 600mm`,
        price: 19500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/HE09250031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/HE09250031.png`
        ],
        variants: [{ label: `Harry Erasmus - 1600mm x 600mm`, price: 19500 }]
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
    statsAvailable: 4,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Marina K - After the Rain`,
        price: 14950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/MK05260041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/MK05260041.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260042.png?v=1779199075`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK052600431200mmx900mm.jpg?v=1779199075`
        ],
        variants: [{ label: `Marina K - After the Rain`, price: 14950 }]
      },
      {
        title: `Marina K - Cape Town Dreams`,
        price: 14950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/MK05260031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/MK05260031.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260032.png?v=1779199000`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK052600331200mmx900mm.jpg?v=1779199000`
        ],
        variants: [{ label: `Marina K - Cape Town Dreams`, price: 14950 }]
      },
      {
        title: `Marina K - Above the Atlantic`,
        price: 3950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/MK05260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/MK05260021.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260022.png?v=1779198928`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260023500mmx360mm.jpg?v=1779198928`
        ],
        variants: [{ label: `Marina K - Above the Atlantic`, price: 3950 }]
      },
      {
        title: `Marina K - Keeper of the Light`,
        price: 3950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/MK05260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/MK05260011.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260012.png?v=1779198762`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/MK05260013500mmx360mm.jpg?v=1779198762`
        ],
        variants: [{ label: `Marina K - Keeper of the Light`, price: 3950 }]
      }
    ]
  },
  {
    id: `corne-weideman`,
    name: `Corne Weideman`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil & Acrylic`,
    style: `Florals, Still Life`,
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
    statsAvailable: 3,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250231.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250231.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250141.png?v=1752068283`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250143460x310Panel-fotor-2025070914116.png?v=1752068284`
        ],
        variants: [{ label: `Corne Weideman - 460mm x 310mm`, price: 1850 }]
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250221.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250221.png`
        ],
        variants: [{ label: `Corne Weideman - 460mm x 310mm`, price: 1850 }]
      },
      {
        title: `Corne Weideman - 460mm x 310mm`,
        price: 1850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250201.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250201.png`
        ],
        variants: [{ label: `Corne Weideman - 460mm x 310mm`, price: 1850 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250131.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250131.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250011.png?v=1752067658`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW07250013400x300Canvas-fotor-20250709142427.png?v=1752067659`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250121.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250121.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250081.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250081.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250071.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250071.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250061.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250061.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250051.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250051.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250021.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - 420mm x 300mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW07250011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW07250011.png`
        ],
        variants: [{ label: `Corne Weideman - 420mm x 300mm`, price: 1690 }]
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CW0924120a.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CW0924120a.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924100a.png?v=1726153226`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924100b.png?v=1726153226`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924100c.jpg?v=1726153226`
        ],
        variants: [{ label: `Corne Weideman - Acrylic on Stretched Canvas`, price: 1690 }]
      },
      {
        title: `Corne Weideman - Acrylic on Stretched Canvas`,
        price: 1690,
        status: `available`,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924100a.png?v=1726153226`,
        images: [
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CW0924100a.png?v=1726153226`
        ],
        variants: [{ label: `Corne Weideman - Acrylic on Stretched Canvas`, price: 1690 }]
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
    statsAvailable: 3,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Ferdinand Kotze - "Fragments of Play: Red Balloon"`,
        price: 23500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/FK0526003_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/FK0526003_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526003_2.png?v=1779886093`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526003_3760mmx1010mm.jpg?v=1779886093`
        ],
        variants: [{ label: `Ferdinand Kotze - "Fragments of Play: Red Balloon"`, price: 23500 }]
      },
      {
        title: `Ferdinand Kotze - "Fragments of Play: Leapfrog"`,
        price: 23500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/FK0526002_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/FK0526002_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526002_2.png?v=1779886023`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526002_3760mmx1010mm.jpg?v=1779886023`
        ],
        variants: [{ label: `Ferdinand Kotze - "Fragments of Play: Leapfrog"`, price: 23500 }]
      },
      {
        title: `Ferdinand Kotze - "Fragments of Play: Toss The Baby"`,
        price: 11500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/FK0526001_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/FK0526001_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526001_2.png?v=1779885791`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/FK0526001_3760mmx600mm.jpg?v=1779885791`
        ],
        variants: [{ label: `Ferdinand Kotze - "Fragments of Play: Toss The Baby"`, price: 11500 }]
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
    statsAvailable: 3,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`,
        price: 1690,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GA1225012_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GA1225012_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250011.png?v=1764169058`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250012.png?v=1764169058`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA11250013.jpg?v=1764169058`
        ],
        variants: [{ label: `Gaynor - Acrylic & Ink on Canvas Panel 200mm x 200mm`, price: 1690 }]
      },
      {
        title: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`,
        price: 3490,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GA12250021_a88edf47-be01-487c-bb99-6b489fb628aa.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GA12250021_a88edf47-be01-487c-bb99-6b489fb628aa.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250011.png?v=1765200006`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250012.png?v=1765200006`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA12250013.jpg?v=1765200006`
        ],
        variants: [{ label: `Gaynor - Oil on Stretched Canvas (400mm x 400mm)`, price: 3490 }]
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 9890,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GA0225001.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GA0225001.png`
        ],
        variants: [{ label: `Gaynor - Oil on Stretched Canvas`, price: 9890 }]
      },
      {
        title: `Gaynor - Oil on Stretched Canvas`,
        price: 9890,
        status: `available`,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1123001.png?v=1701331826`,
        images: [
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1123001.png?v=1701331826`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA1123001copy.jpg?v=1701331826`
        ],
        variants: [{ label: `Gaynor - Oil on Stretched Canvas`, price: 9890 }]
      },
      {
        title: `Oil on Stretched Canvas by Gaynor`,
        price: 18500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GA08230121.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GA08230121.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GA26102201400x400.jpg?v=1694601136`
        ],
        variants: [{ label: `Oil on Stretched Canvas by Gaynor`, price: 18500 }]
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
    statsAvailable: 3,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Jonel Scholtz - "I'm Still Here"`,
        price: 18500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/JS0526003_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/JS0526003_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526003_2.png?v=1779886752`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526003_31220mmx920mm.jpg?v=1779886752`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526003_4.jpg?v=1779886752`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526003_5.jpg?v=1779886752`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526003_6.jpg?v=1779886752`
        ],
        variants: [{ label: `Jonel Scholtz - "I'm Still Here"`, price: 18500 }]
      },
      {
        title: `Jonel Scholtz - "The Weight of Quiet Things"`,
        price: 18500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/JS0526002_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/JS0526002_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526002_2.png?v=1779886670`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526002_31220mmx920mm.jpg?v=1779886670`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526002_4.jpg?v=1779886670`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526002_5.jpg?v=1779886670`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526002_6.jpg?v=1779886671`
        ],
        variants: [{ label: `Jonel Scholtz - "The Weight of Quiet Things"`, price: 18500 }]
      },
      {
        title: `Jonel Scholtz - "As 'n Draai jou Omgooi"`,
        price: 12850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/JS0526001_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/JS0526001_1.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526001_2.png?v=1779886386`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526001_31010mmx760mm.jpg?v=1779886386`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526001_4.jpg?v=1779886386`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526001_5.jpg?v=1779886385`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JS0526001_6.jpg?v=1779886385`
        ],
        variants: [{ label: `Jonel Scholtz - "As 'n Draai jou Omgooi"`, price: 12850 }]
      }
    ]
  },
  {
    id: `niki-mcqueen`,
    name: `Niki McQueen`,
    born: null,
    birthplace: `South Africa`,
    medium: `Mixed Media`,
    style: `Contemporary, Fantasy`,
    bio: `Niki McQueen: The Art of Surreal Realities

Niki McQueen, a visual artist and communications and graphic design specialist from Cape Town, blends her background in Marine Biology with a unique artistic vision. Amid the Covid pandemic, Niki developed a distinctive technique, crafting richly colored, surreal artworks from digital composites. These pieces are meticulously hand-printed and hand-drawn onto heavy archival papers, then washed, painted, and finished through a perfected 10-step process.

Inspired by vintage medical and scientific illustrations, surrealism, street art, and magical realism, Niki’s work delves into personal symbolism and fantastical realms. Her themes encompass anatomy, biology, psychology, mythology, innocence, joy, and the cycle of decay and rebirth. Each piece invites viewers to find their own interpretations.

With over 600 artworks, Niki's portfolio is divided into two parts: her surreal and symbolic fine art under "Niki McQueen Art," and the playful, childlike expressions of "Life Beyond Reason." Through her art, Niki channels psychological and emotional experiences, creating works that evoke both introspection and joy.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/2.jpg?v=1716198912`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/niki-mcqueen`,
    statsAvailable: 3,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Niki McQueen - "Travels by Moonlight" Mixed Media on Archival Paper`,
        price: 17900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/NM0524003.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/NM0524003.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524003Travel-by-moonligh-webt.jpg?v=1716200536`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524003travels-by-moonlight.jpgFramed.jpg?v=1716200535`
        ],
        variants: [{ label: `Niki McQueen - "Travels by Moonlight" Mixed Media on Archival Paper`, price: 17900 }]
      },
      {
        title: `Niki McQueen - "Queer Flock" Mixed Media on Archival Paper`,
        price: 16200,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/NM0524002.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/NM0524002.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524002QF-2024-a2-nw.jpg?v=1716200380`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524002queer-flock.jpg?v=1716200380`
        ],
        variants: [{ label: `Niki McQueen - "Queer Flock" Mixed Media on Archival Paper`, price: 16200 }]
      },
      {
        title: `Niki McQueen - "Whale Gazing" Mixed Media on Archival Paper`,
        price: 8750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/NM0524001.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/NM0524001.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/whale-gazing.jpg?v=1716200116`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/NM0524001whale-gazing.jpgFramed.jpg?v=1716200113`
        ],
        variants: [{ label: `Niki McQueen - "Whale Gazing" Mixed Media on Archival Paper`, price: 8750 }]
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
    statsAvailable: 2,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 37800,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924010.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924010.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0924001900x300copy.jpg?v=1726146059`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG09240011170x570Framedcopy.jpg?v=1726146059`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 37800 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924009.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924009.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 27000 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924008.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924008.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 27000 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924007.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924007.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 27000 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924006.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924006.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 27000 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 23880,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924005.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924005.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 23880 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 24880,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924004.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924004.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 24880 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 23880,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924003.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924003.png`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 23880 }]
      },
      {
        title: `Anton Gericke - Acrylic on Panel (Framed)`,
        price: 27000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/AG0924001.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/AG0924001.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG09240018.png?v=1726146059`
        ],
        variants: [{ label: `Anton Gericke - Acrylic on Panel (Framed)`, price: 27000 }]
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/14.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/14.png`
        ],
        variants: [{ label: `Acrylic on Panel by Anton Gericke`, price: 15480 }]
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/12.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/12.png`
        ],
        variants: [{ label: `Acrylic on Panel by Anton Gericke`, price: 15480 }]
      },
      {
        title: `Acrylic on Panel by Anton Gericke`,
        price: 15480,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/11_80dc09a4-925b-4742-8a82-7fbc40bb260d.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/11_80dc09a4-925b-4742-8a82-7fbc40bb260d.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0823001900x300.jpg?v=1726147106`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/AG0823001.jpg?v=1726147112`
        ],
        variants: [{ label: `Acrylic on Panel by Anton Gericke`, price: 15480 }]
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
    statsAvailable: 2,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GF05260061.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GF05260061.png`
        ],
        variants: [{ label: `Gerhard Fourie - 700mm x 500mm`, price: 4750 }]
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GF05260051.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GF05260051.png`
        ],
        variants: [{ label: `Gerhard Fourie - 700mm x 500mm`, price: 4750 }]
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GF05260041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GF05260041.png`
        ],
        variants: [{ label: `Gerhard Fourie - 700mm x 500mm`, price: 4750 }]
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GF05260031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GF05260031.png`
        ],
        variants: [{ label: `Gerhard Fourie - 700mm x 500mm`, price: 4750 }]
      },
      {
        title: `Gerhard Fourie - 700mm x 500mm`,
        price: 4750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GF05260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GF05260021.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260022.png?v=1779198318`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260023700mmx500mm.jpg?v=1779198319`
        ],
        variants: [{ label: `Gerhard Fourie - 700mm x 500mm`, price: 4750 }]
      },
      {
        title: `Gerhard Fourie - 600mm x 300mm`,
        price: 2300,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/GF05260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/GF05260011.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260012.png?v=1779198135`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/GF05260013600x300.jpg?v=1779198135`
        ],
        variants: [{ label: `Gerhard Fourie - 600mm x 300mm`, price: 2300 }]
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
    statsAvailable: 2,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 34500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/IH0226004.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/IH0226004.png`
        ],
        variants: [{ label: `Ian Hertslet - Oil on Canvas`, price: 34500 }]
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 27600,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/IH0226003.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/IH0226003.png`
        ],
        variants: [{ label: `Ian Hertslet - Oil on Canvas`, price: 27600 }]
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 19750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/IH0226002.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/IH0226002.png`
        ],
        variants: [{ label: `Ian Hertslet - Oil on Canvas`, price: 19750 }]
      },
      {
        title: `Ian Hertslet - Oil on Canvas`,
        price: 19750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/IH0226001.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/IH0226001.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH02260010.png?v=1770369801`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH02260010920x6610copy.jpg?v=1770369801`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH02260011copy.jpg?v=1770369801`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH02260012copy.jpg?v=1770369801`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH02260013copy.jpg?v=1770369801`
        ],
        variants: [{ label: `Ian Hertslet - Oil on Canvas`, price: 19750 }]
      },
      {
        title: `Oil on Stretched Canvas by Ian Hertslet`,
        price: 28500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/IH0823001.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/IH0823001.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH08230010.png?v=1770369626`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/IH08230011200mmx900mmcopy.jpg?v=1770369626`
        ],
        variants: [{ label: `Oil on Stretched Canvas by Ian Hertslet`, price: 28500 }]
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
    statsAvailable: 2,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Acrylic on Stretched Canvas by Junior Fungai`,
        price: 3850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/95.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/95.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JF003750mmx500mm.jpg?v=1694704121`
        ],
        variants: [{ label: `Acrylic on Stretched Canvas by Junior Fungai`, price: 3850 }]
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 6900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/98.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/98.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/JF090_ad1d8105-4f34-4b77-84c0-bb2607d7b983.jpg?v=1694703718`
        ],
        variants: [{ label: `Acrylic on Rolled Canvas by Junior Fungai`, price: 6900 }]
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 6900,
        status: `available`,
        image: `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/96_9ad335bb-aa59-45b2-82ce-5674090fa784.png?v=1694703718`,
        images: [
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/96_9ad335bb-aa59-45b2-82ce-5674090fa784.png?v=1694703718`
        ],
        variants: [{ label: `Acrylic on Rolled Canvas by Junior Fungai`, price: 6900 }]
      },
      {
        title: `Acrylic on Rolled Canvas by Junior Fungai`,
        price: 6900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/99.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/99.png`
        ],
        variants: [{ label: `Acrylic on Rolled Canvas by Junior Fungai`, price: 6900 }]
      }
    ]
  },
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
    statsAvailable: 2,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 14750,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/SM0526002_1.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/SM0526002_1.png`
        ],
        variants: [{ label: `Solly Manthata - 1200mm x 800mm`, price: 14750 }]
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 13800,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/SM06240071_be73068b-828c-46f2-875b-a975c0750fdc.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/SM06240071_be73068b-828c-46f2-875b-a975c0750fdc.png`
        ],
        variants: [{ label: `Solly Manthata - 1200mm x 800mm`, price: 13800 }]
      },
      {
        title: `Solly Manthata - 1200mm x 800mm`,
        price: 12990,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/SM01260041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/SM01260041.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260042.png?v=1768818604`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SM01260041200mmx800mmcopy.jpg?v=1768818603`
        ],
        variants: [{ label: `Solly Manthata - 1200mm x 800mm`, price: 12990 }]
      },
      {
        title: `Solly Manthata - Triptych (3 in 1) Oil & Acrylic on Stretched Canvas`,
        price: 10950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/xSM1225001_1_61379b31-5cd1-4ede-9294-81ac409d2b5f.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/xSM1225001_1_61379b31-5cd1-4ede-9294-81ac409d2b5f.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/xSM1225001_2.png?v=1765456252`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/xSM1225001_3.jpg?v=1765456252`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/xSM1225001_4.jpg?v=1765456252`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/xSM1225001_5.jpg?v=1765456252`
        ],
        variants: [{ label: `Solly Manthata - Triptych (3 in 1) Oil & Acrylic on Stretched Canvas`, price: 10950 }]
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
    statsAvailable: 1,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Craig Stuart - (613mm x 307mm)`,
        price: 6900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CS03260041.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CS03260041.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260042.png?v=1774952431`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260043613x307.jpg?v=1774952430`
        ],
        variants: [{ label: `Craig Stuart - (613mm x 307mm)`, price: 6900 }]
      },
      {
        title: `Craig Stuart - (607mm x 457mm)`,
        price: 14500,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CS03260031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CS03260031.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260032.png?v=1774952300`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260033607x457.jpg?v=1774952300`
        ],
        variants: [{ label: `Craig Stuart - (607mm x 457mm)`, price: 14500 }]
      },
      {
        title: `Craig Stuart - (840mm x 595mm)`,
        price: 23000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CS03260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CS03260021.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260022.png?v=1774952224`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260023840x595.jpg?v=1774952223`
        ],
        variants: [{ label: `Craig Stuart - (840mm x 595mm)`, price: 23000 }]
      },
      {
        title: `Craig Stuart - (1189mm x 840mm)`,
        price: 35000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CS03260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CS03260011.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS03260012.png?v=1774952034`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/CS032600131189x840.jpg?v=1774952033`
        ],
        variants: [{ label: `Craig Stuart - (1189mm x 840mm)`, price: 35000 }]
      },
      {
        title: `Craig Stuart - (613mm x 307mm)`,
        price: 6900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/CS03260051.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/CS03260051.png`
        ],
        variants: [{ label: `Craig Stuart - (613mm x 307mm)`, price: 6900 }]
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
    statsAvailable: 1,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Dante Ruben - (610mm x 510mm)`,
        price: 14950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/DR05260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/DR05260011.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR05260012.png?v=1779199638`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR05260013610mmx510mm.jpg?v=1779199638`
        ],
        variants: [{ label: `Dante Ruben - (610mm x 510mm)`, price: 14950 }]
      },
      {
        title: `Dante Ruben - (1500mm x 900mm)`,
        price: 35000,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/DR03260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/DR03260021.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR03260022.png?v=1774949699`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR032600231500x900mm.jpg?v=1774949699`
        ],
        variants: [{ label: `Dante Ruben - (1500mm x 900mm)`, price: 35000 }]
      },
      {
        title: `Dante Ruben - (900mm x 900mm)`,
        price: 18900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/DR03260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/DR03260011.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR03260012.png?v=1774949632`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/DR03260013900x900mm.jpg?v=1774949632`
        ],
        variants: [{ label: `Dante Ruben - (900mm x 900mm)`, price: 18900 }]
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
    statsAvailable: 1,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Emile Cronje - Acrylic on Panel (600mm x 300mm)`,
        price: 3850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/EC03260011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/EC03260011.png`
        ],
        variants: [{ label: `Emile Cronje - Acrylic on Panel (600mm x 300mm)`, price: 3850 }]
      },
      {
        title: `Emile Cronje - Acrylic on Panel (600mm x 300mm)`,
        price: 3850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/EC03260021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/EC03260021.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260022.png?v=1774538281`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260023600x300mmcopy.jpg?v=1774538280`
        ],
        variants: [{ label: `Emile Cronje - Acrylic on Panel (600mm x 300mm)`, price: 3850 }]
      },
      {
        title: `Emile Cronje - Acrylic on Panel (580mm x 330mm)`,
        price: 3850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/EC03260031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/EC03260031.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260032.png?v=1774538236`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC03260033580x330mmcopy.jpg?v=1774538236`
        ],
        variants: [{ label: `Emile Cronje - Acrylic on Panel (580mm x 330mm)`, price: 3850 }]
      },
      {
        title: `Emile Cronje - Acrylic on Panel (590mm x 330mm)`,
        price: 3850,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/EC12250031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/EC12250031.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC12250032.png?v=1765200668`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/EC12250033590mmx330mmcopy.jpg?v=1765200668`
        ],
        variants: [{ label: `Emile Cronje - Acrylic on Panel (590mm x 330mm)`, price: 3850 }]
      }
    ]
  },
  {
    id: `louise-de-klerk`,
    name: `Louise de Klerk`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Figurative, Musicians`,
    bio: `Louise de Klerk: Painting Life's Vibrant Stories

Born in the vibrant city of Johannesburg in 1967, Louise de Klerk's roots extend deep into the picturesque countryside of the Northern Cape. Her formative years were steeped in a sense of nostalgia, a time when children reveled in the freedom to play untamed, attending school barefoot, and hitching a horsecart for a school bus. It was during these cherished days that Louise's innate artistic flair began to bloom.

Her educational journey took her to Klerksdorp, where she matriculated before embarking on an academic pursuit that led to her earning a BA Comm Honors Degree. Surrounded by art students who became her closest friends, she found herself drawn to the vibrant world of creativity.

Louise initially engaged with her family business, but the call of art tugged relentlessly at her soul. In 2004, she answered that call wholeheartedly, dedicating herself to her artistry. For Louise, the canvas became her sanctuary, where colors swirled in harmonious chaos and imagination knew no bounds.

While she largely identifies as a self-taught artist, Louise's thirst for knowledge led her to absorb insights from fellow artists she regards as mentors. Her artistry thrives on experimentation, and she gracefully navigates a range of styles, techniques, and subjects. Among her favored explorations, the human face and figure hold a special place. Whether rendered in classical, romantic, abstract, or even whimsical forms, these figures unveil her multifaceted creativity.

Her preferred medium is oils, though acrylics and mixed media also dance upon her canvases. Inspiration finds its roots in the world around her, from the people she encounters to the landscapes that stir her memories. Louise's art beckons viewers into a realm where reality interlaces with dreamscapes, and every stroke of her brush tells a story.

Louise's artistic journey has graced numerous group and solo exhibitions, leaving an indelible mark on art enthusiasts and galleries throughout the country. Her works have become cherished pieces, breathing life into the spaces they adorn, and inviting all to explore the kaleidoscope of her creativity.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/Artist_Photos_LDK.png?v=1696534757`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/louise-de-klerk`,
    statsAvailable: 1,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230051.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230051.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK1023001copy.jpg?v=1696534254`
        ],
        variants: [{ label: `Louise de Klerk Oil on Stretched Canvas`, price: 8900 }]
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230031.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230031.png`
        ],
        variants: [{ label: `Louise de Klerk Oil on Stretched Canvas`, price: 8900 }]
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230021.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230021.png`
        ],
        variants: [{ label: `Louise de Klerk Oil on Stretched Canvas`, price: 8900 }]
      },
      {
        title: `Louise de Klerk Oil on Stretched Canvas`,
        price: 8900,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230011.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/LDK10230011.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/LDK10230011.png?v=1696534254`
        ],
        variants: [{ label: `Louise de Klerk Oil on Stretched Canvas`, price: 8900 }]
      }
    ]
  },
  {
    id: `stef-van-den-berg`,
    name: `Stef van den Berg`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic on Panel`,
    style: `Florals, Still Life`,
    bio: `Stef van den Berg: A Professor of Art

Known by both Stef and Riaan van den Berg, this artistic talent forged a remarkable path in the world of art. After retiring from his role as a professor of art at the University of Potchefstroom, Stef transitioned into a new chapter, opening a thriving business in Parys.

His artistic legacy stretches far beyond the borders of South Africa, leaving an indelible mark on both local and international art markets. Collectors from around the world have sought and cherished his works, transforming his creations into prized treasures that transcend geographic boundaries.

In the vivid strokes and nuanced palettes of Stef van den Berg's art, we glimpse a lifetime of passion, dedication, and unwavering commitment to the craft. His canvas becomes a reflection of a life lived in brilliance, where art knows no bounds, and creativity flows freely.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/Stef_van_den_Berg.png?v=1695061975`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/stef-van-den-berg`,
    statsAvailable: 1,
    statsSold: 0,
    statsHighestSold: 0,
    works: [
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 4950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/133.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/133.png`,
          `https://cdn.shopify.com/s/files/1/0817/0510/7760/files/SVDB001300x220framed500x420F2.jpg?v=1694971230`
        ],
        variants: [{ label: `Acrylic on Panel by Stef van den Berg`, price: 4950 }]
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 4950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/132.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/132.png`
        ],
        variants: [{ label: `Acrylic on Panel by Stef van den Berg`, price: 4950 }]
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/131.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/131.png`
        ],
        variants: [{ label: `Acrylic on Panel by Stef van den Berg`, price: 3950 }]
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/129.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/129.png`
        ],
        variants: [{ label: `Acrylic on Panel by Stef van den Berg`, price: 3950 }]
      },
      {
        title: `Acrylic on Panel by Stef van den Berg`,
        price: 3950,
        status: `available`,
        image: `https://thewinelandsartgallery.com/cdn/shop/files/128.png`,
        images: [
          `https://thewinelandsartgallery.com/cdn/shop/files/128.png`
        ],
        variants: [{ label: `Acrylic on Panel by Stef van den Berg`, price: 3950 }]
      }
    ]
  },
  {
    id: `anmari`,
    name: `Anmari`,
    born: null,
    birthplace: `South Africa`,
    medium: `Acrylic`,
    style: `Figurative`,
    bio: `Anmari: Painting a Legacy of Compassion

Anmari's life has been a journey defined by the pursuit of bettering the human condition. Trained as a social worker, she dedicated herself to making a profound difference in the lives of others. Yet, it was in the later chapters of her life that a hidden talent, an uncharted passion, was unveiled: the gift of artistry.


Today, Anmari proudly finds her place among the represented artists of The Winelands Art Gallery. In a retirement home, where many might see an end to creative potential, she discovered a vibrant new beginning. As a self-taught artist, her canvases now resonate with the colors of her soul, each stroke a testament to a lifetime of experiences and an unwavering commitment to paint her way through the years ahead.

For Anmari, art isn't just a newfound pursuit; it's a lifelong commitment—a promise to herself and the world. In her work, she continues to touch hearts, leaving behind a legacy of compassion that speaks to the enduring power of the human spirit in every stroke of the brush.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/14_2.png?v=1693929176`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/anmari-painting-a-legacy-of-compassion`,
    statsAvailable: 0,
    statsSold: 0,
    statsHighestSold: 0,
    works: []
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
    statsAvailable: 0,
    statsSold: 0,
    statsHighestSold: 0,
    works: []
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
    statsAvailable: 0,
    statsSold: 0,
    statsHighestSold: 0,
    works: []
  },
  {
    id: `jeanne-pretorius`,
    name: `Jeanne Marais Pretorius`,
    born: null,
    birthplace: `South Africa`,
    medium: `Oil on Canvas`,
    style: `Figurative, Landscapes`,
    bio: `Jeanne Marais Pretorius: Crafting Life's Palette

Jeanne Marais, now Jeanne Pretorius, blossomed in a nurturing childhood, where the seeds of her remarkable talent were sown. Today, she stands as a dynamic, self-taught artist of boundless versatility.

Her artistry is a tapestry of exclusive and unique female figure studies, yet her prowess extends gracefully into various other themes. With a masterful command of color, she paints vibrant landscapes and cityscapes that pulse with dramatic intensity. For the past 13 years, she has wielded the brush and palette knife with finesse in her exploration of oils.

Jeanne's oeuvre has graced three remarkable solo exhibitions (2010, 2012, & 2015), and her works find homes in galleries across Pretoria, Hartebeespoort, Clarens, and beyond. Her international clientele bears testimony to the timeless allure of her creations.

Nestled in Centurion, South Africa, Jeanne shares her life with her husband Louis and their two daughters. In her own words, "The real advantage of my career as an artist is being in the fortunate position to do what I love for a living!" Her art embodies that love, enriching lives with every stroke of her brush.`,
    image: `https://thewinelandsartgallery.com/cdn/shop/collections/3_6.png?v=1695061361`,
    galleryUrl: `https://thewinelandsartgallery.com/collections/jeanne-marais-pretorius`,
    statsAvailable: 0,
    statsSold: 0,
    statsHighestSold: 0,
    works: []
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
    statsAvailable: 0,
    statsSold: 0,
    statsHighestSold: 0,
    works: []
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
    statsAvailable: 0,
    statsSold: 0,
    statsHighestSold: 0,
    works: []
  }
];

// ─── BACKING MODEL ───────────────────────────────────────────────────
// DEPOSIT TIERS (upfront — backer owns the artwork):
//   R0        – R500,000    → 20% deposit
//   R500,001  – R1,000,000  → 15% deposit
//   R1,000,001+             → 10% deposit
//
// AUCTION PLATFORM FEE: remaining % to reach 50%, paid over 24 months
//
// SALE SPLIT:
//   Months 1–24:  50% to backer, 50% to gallery
//   Months 25–36: 100% to backer (fully paid off, year 3 is FREE)
//   Month 37+:    Backer takes physical artwork
//
// At month 25 artwork is fully paid off — backer gets everything.

const TERM_MONTHS = 24;
const FREE_MONTHS = 12; // year 3 free (months 25-36)
const TOTAL_MONTHS = TERM_MONTHS + FREE_MONTHS; // 36

const getDepositPct = (artworkValue) => {
  if (artworkValue <= 500000) return 0.20;
  if (artworkValue <= 1000000) return 0.15;
  return 0.10;
};

const calcBacking = (artworkValue, salePrice, monthSold) => {
  const av = artworkValue || 0;
  const sp = salePrice || av;
  const mo = Math.max(1, monthSold || 1);
  const depositPct = getDepositPct(av);
  const deposit = av * depositPct;
  const monthlyFeePct = (0.50 - depositPct) / TERM_MONTHS;
  const monthly = av * monthlyFeePct;
  const totalMonthlyFees = av * (0.50 - depositPct); // 30% total fees

  // Fees only accrue for months 1-24
  const feesMonths = Math.min(mo, TERM_MONTHS);
  const feesPaid = monthly * feesMonths;
  const totalPaid = deposit + feesPaid; // max = 50% of artwork value

  // Fully paid off from month 25
  const fullyPaidOff = mo > TERM_MONTHS;
  const isYearThreeFree = mo > TERM_MONTHS && mo <= TOTAL_MONTHS;
  const artworkReturned = mo > TOTAL_MONTHS;

  // Backer gets 50% during months 1-24, 100% from month 25
  const backerSharePct = fullyPaidOff ? 1.0 : 0.50;
  const backerShare = sp * backerSharePct;
  const netReturn = backerShare - totalPaid;
  const roi = totalPaid > 0 ? (netReturn / totalPaid) * 100 : 0;

  // Physical artwork value at month 25+ = recommended price - what they paid (50%)
  const artworkTakeValue = av - totalPaid; // always av * 0.50 at month 24

  return {
    depositPct, deposit, monthly, totalMonthlyFees,
    feesPaid, totalPaid,
    backerSharePct, backerShare, netReturn, roi,
    fullyPaidOff, isYearThreeFree, artworkReturned,
    artworkTakeValue, salePrice: sp, month: mo,
  };
};

// ─── STYLE HELPERS ───────────────────────────────────────────────────
const gF = "'Cormorant Garamond', Georgia, serif";
const sF = "'DM Sans', -apple-system, sans-serif";

// ─── GLOBAL CSS ──────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    /* Google Fonts loaded via layout.js */
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
function Nav({ page, setPage, isAdmin, onAdminLogin, onSignOut }) {
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
      {isAdmin ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.green, background: C.greenDim, border: `1px solid rgba(90,170,122,0.4)`, padding: '4px 10px', borderRadius: 3 }}>
            Admin
          </div>
          <button onClick={onSignOut} style={{ background: 'none', border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.fog, fontFamily: sF, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 12px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      ) : (
        <button onClick={onAdminLogin} style={{ marginLeft: 8, background: 'none', border: 'none', color: C.fog, fontFamily: sF, fontSize: 10, cursor: 'pointer', opacity: 0.4, letterSpacing: '0.08em' }}>
          Admin
        </button>
      )}
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
            A platform connecting art backers with South Africa's finest working artists. Back an artist, display exceptional art, and share in the proceeds when it sells.
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
          ['50 / 50', 'Sale Split'],
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
              Discover the Latest Works by Our Artists
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
              { num: '01', title: 'Choose an Artist', body: 'Browse our curated roster of South African masters. Each profile includes a full biography, available works, and sold history.' },
              { num: '02', title: 'Select a Work', body: 'Pick an artwork that moves you. The piece goes on display at a gallery partner location for the duration of your backing term.' },
              { num: '03', title: 'Pay a Monthly Display Fee', body: 'As a backer you pay a monthly display license fee — 50% of the artwork value spread across your chosen term of 6, 12, or 24 months.' },
              { num: '04', title: 'Share in the Sale', body: 'When the artwork sells, you receive 50% of the sale price. Your monthly fees paid to date are deducted — the calculator shows your exact net return.' },
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

  const mediums = ['all', ...new Set(ARTISTS.map(a => (a.medium||'').split(' & ')[0].split(',')[0].trim()).filter(Boolean))];
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
  const allPrices = artist.works.map(w => w.price).filter(p => p > 0);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

  return (
    <div
      style={{
        background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 6,
        overflow: 'hidden',
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
            [artist.statsHighestSold > 0 ? `R${fmt(artist.statsHighestSold)}` : `R${fmt(minPrice)}`, artist.statsHighestSold > 0 ? 'Highest Sold' : 'From'],
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
function ArtistDetail({ artist, setPage, isAdmin, getWorkStatus, onMarkSold, onMarkAvailable, loadingKey, basket, toggleBasket, inBasket }) {
  const [selectedWork, setSelectedWork] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [calcSaleVal, setCalcSaleVal] = useState('');
  const [calcMonths, setCalcMonths] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);
  useEffect(() => { setImgIdx(0); setCalcSaleVal(''); setCalcMonths(''); }, [selectedWork]);

  if (!artist) { setPage('artists'); return null; }

  const works = (artist.works || []).map(w => ({
    ...w,
    status: getWorkStatus ? getWorkStatus(w, artist.id) : (w.status || 'available'),
  }));
  const available = works.filter(w => w.status === 'available');
  const sold = works.filter(w => w.status === 'sold');

  // Calculator logic for selected work
  const sw = selectedWork;
  const av = sw ? sw.price : 0;
  const sp = parseFloat(calcSaleVal) || av;
  const m = { label: 'Standard', term: TERM_MONTHS };
  const mo = Math.max(1, Math.min(parseInt(calcMonths) || TERM_MONTHS, TERM_MONTHS));
  const deal = av > 0 ? calcBacking(av, sp, parseInt(calcMonths) || TERM_MONTHS) : null;

  const swBasketWork = sw ? { ...sw, artistName: artist.name, artistId: artist.id } : null;
  const swInBasket = sw && inBasket && swBasketWork ? inBasket(swBasketWork) : false;

  const zoomImg = selectedWork ? ((selectedWork.images||[])[imgIdx] || selectedWork.image || '') : '';

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>

      {/* ── Zoom modal ── */}
      {zoomOpen && zoomImg && (
        <div onClick={() => setZoomOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.96)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out', padding: 20,
        }}>
          <button onClick={() => setZoomOpen(false)} style={{
            position: 'absolute', top: 20, right: 24, background: 'none', border: 'none',
            color: C.fog, fontSize: 36, cursor: 'pointer', lineHeight: 1, zIndex: 1,
          }}>×</button>
          {(selectedWork.images||[]).length > 1 && (<>
            <button onClick={e => { e.stopPropagation(); setImgIdx(i => i > 0 ? i-1 : (selectedWork.images||[]).length-1); }}
              style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(26,39,68,0.85)', border: `1px solid ${C.goldBorder}`, borderRadius: '50%', width: 44, height: 44, color: C.gold, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>‹</button>
            <button onClick={e => { e.stopPropagation(); setImgIdx(i => i < (selectedWork.images||[]).length-1 ? i+1 : 0); }}
              style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(26,39,68,0.85)', border: `1px solid ${C.goldBorder}`, borderRadius: '50%', width: 44, height: 44, color: C.gold, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>›</button>
          </>)}
          <img src={zoomImg} alt={selectedWork?.title} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', cursor: 'default', borderRadius: 4 }} />
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontFamily: gF, fontSize: 16, color: C.cream, marginBottom: 4 }}>{selectedWork?.title}</div>
            {(selectedWork.images||[]).length > 1 && (
              <div style={{ fontSize: 11, color: C.fog }}>{imgIdx+1} / {(selectedWork.images||[]).length}</div>
            )}
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <div style={{
        position: 'relative', minHeight: 360, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end',
        background: C.inkMid, borderBottom: `1px solid ${C.goldBorder}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${artist.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          filter: 'brightness(0.18)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(26,39,68,1) 0%, rgba(26,39,68,0.5) 55%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 40px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <button onClick={() => setPage('artists')} style={{
            background: 'none', border: 'none', color: C.fog, fontFamily: sF,
            fontSize: 12, cursor: 'pointer', marginBottom: 16, letterSpacing: '0.1em',
          }}>← All Artists</button>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{
              width: 100, height: 100, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${C.gold}`, boxShadow: `0 0 32px rgba(201,168,76,0.3)`,
            }}>
              <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                {artist.medium}{artist.birthplace ? ` · ${artist.birthplace}` : ''}
              </div>
              <h1 style={{ fontFamily: gF, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 8 }}>
                {artist.name}
              </h1>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 11, color: C.fog }}>{available.length} available</span>
                {sold.length > 0 && <><span style={{ fontSize: 11, color: C.fog }}>·</span><span style={{ fontSize: 11, color: C.fog }}>{sold.length} sold</span></>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: 3 columns ── */}
      <div style={{ padding: '48px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 320px', gap: 40, alignItems: 'start' }}>

          {/* ── Left: Bio + Work Grid ── */}
          <div>
            {/* Biography */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 16 }}>Biography</div>
              {(artist.bio || '').split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i} style={{ fontSize: 14, color: 'rgba(232,237,245,0.7)', lineHeight: 1.9, marginBottom: 16, fontWeight: 300 }}>
                  {para.trim()}
                </p>
              ))}
            </section>

            {/* Available works */}
            <section>
              <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.gold, marginBottom: 20 }}>
                Available for Backing ({available.length})
              </div>
              {available.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.fog, fontSize: 13 }}>
                  No works currently available.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {available.map((work, i) => {
                    const wk = { ...work, artistName: artist.name, artistId: artist.id };
                    const isSelected = selectedWork && selectedWork.title === work.title && selectedWork.image === work.image;
                    const isInBasket = inBasket && inBasket(wk);
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedWork(work)}
                        style={{
                          borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                          border: isSelected
                            ? `2px solid ${C.gold}`
                            : `1px solid ${C.goldBorder}`,
                          background: C.inkMid,
                          transform: isSelected ? 'translateY(-3px)' : 'none',
                          boxShadow: isSelected ? `0 8px 24px rgba(201,168,76,0.3)` : 'none',
                          transition: 'all 0.2s ease',
                                                                            }}>
                        {/* Image */}
                        <div style={{ position: 'relative', paddingBottom: '90%', overflow: 'hidden' }}>
                          <img
                            src={work.image}
                            alt={work.title}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                          />
                          {/* Image count badge */}
                          {(work.images||[]).length > 1 && (
                            <div style={{
                              position: 'absolute', bottom: 6, right: 6,
                              fontSize: 9, fontWeight: 700, color: C.cream,
                              background: 'rgba(26,39,68,0.85)', padding: '2px 6px', borderRadius: 3,
                              letterSpacing: '0.05em',
                            }}>
                              {work.images.length} images
                            </div>
                          )}
                          {/* Basket indicator */}
                          {isInBasket && (
                            <div style={{
                              position: 'absolute', top: 6, left: 6,
                              fontSize: 9, fontWeight: 700, color: '#fff',
                              background: '#3a7a52', padding: '2px 7px', borderRadius: 3,
                            }}>✓</div>
                          )}
                        </div>
                        {/* Info */}
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: C.cream, lineHeight: 1.3, marginBottom: 4, 
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {work.title}
                          </div>
                          <div style={{ fontFamily: gF, fontSize: 17, color: isSelected ? C.gold : C.goldLight }}>
                            R {work.price.toLocaleString('en-ZA')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sold archive */}
              {sold.length > 0 && (
                <div style={{ marginTop: 48 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: C.fog, marginBottom: 16 }}>
                    Sold Archive ({sold.length})
                  </div>
                  <div style={{ padding: '12px 16px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, fontSize: 12, color: C.fog, lineHeight: 1.7, marginBottom: 20 }}>
                    Every sold work is evidence of collector demand for {artist.name}'s art.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                    {sold.map((work, i) => (
                      <div key={i} style={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${C.goldBorder}`, background: C.inkMid, opacity: 0.7 }}>
                        <div style={{ position: 'relative', paddingBottom: '90%', overflow: 'hidden' }}>
                          <img src={work.image} alt={work.title}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                          <div style={{
                            position: 'absolute', top: 6, left: 6, fontSize: 9, fontWeight: 700,
                            color: C.green, background: 'rgba(10,16,32,0.9)', border: `1px solid rgba(90,170,122,0.5)`,
                            padding: '2px 7px', borderRadius: 3, letterSpacing: '0.1em',
                          }}>Sold</div>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, color: C.fog, lineHeight: 1.3, marginBottom: 3,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {work.title}
                          </div>
                          <div style={{ fontFamily: gF, fontSize: 15, color: C.green }}>R {work.price.toLocaleString('en-ZA')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Centre: Selected Work Detail + Image Carousel ── */}
          <div style={{ position: 'sticky', top: 90 }}>
            {!selectedWork ? (
              <div style={{
                border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid,
                padding: '48px 24px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: gF, fontSize: 48, color: C.gold, opacity: 0.15, marginBottom: 16 }}>◆</div>
                <div style={{ fontFamily: gF, fontSize: 18, color: C.fog, fontWeight: 300 }}>Select a work to view its folio</div>
                <div style={{ fontSize: 12, color: C.fog, opacity: 0.6, marginTop: 8 }}>Click any artwork on the left</div>
              </div>
            ) : (
              <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid, overflow: 'hidden' }}>
                {/* Main image */}
                <div
                  onClick={() => setZoomOpen(true)}
                  style={{ position: 'relative', paddingBottom: '80%', overflow: 'hidden', background: C.ink, cursor: 'zoom-in' }}>
                  <img
                    key={imgIdx}
                    src={(selectedWork.images || [])[imgIdx] || selectedWork.image || ""}
                    alt={selectedWork.title}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.3s ease' }}
                  />
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(26,39,68,0.85)', border: `1px solid ${C.goldBorder}`, borderRadius: 4, padding: '4px 10px', fontSize: 10, color: C.gold, pointerEvents: 'none' }}>
                    ⊕ Zoom
                  </div>
                  {/* Nav arrows */}
                  {(selectedWork.images || []).length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIdx(i => i > 0 ? i - 1 : (selectedWork.images||[]).length - 1)}
                        style={{
                          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(26,39,68,0.8)', border: `1px solid ${C.goldBorder}`,
                          borderRadius: '50%', width: 36, height: 36, color: C.gold, fontSize: 16,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>‹</button>
                      <button
                        onClick={() => setImgIdx(i => i < (selectedWork.images||[]).length - 1 ? i + 1 : 0)}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(26,39,68,0.8)', border: `1px solid ${C.goldBorder}`,
                          borderRadius: '50%', width: 36, height: 36, color: C.gold, fontSize: 16,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>›</button>
                      <div style={{
                        position: 'absolute', bottom: 10, right: 10,
                        fontSize: 10, color: C.cream, background: 'rgba(26,39,68,0.8)',
                        padding: '3px 8px', borderRadius: 3,
                      }}>{imgIdx + 1} / {(selectedWork.images||[]).length}</div>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                {(selectedWork.images||[]).length > 1 && (
                  <div style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto', background: C.ink, borderBottom: `1px solid ${C.goldBorder}` }}>
                    {(selectedWork.images||[]).map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setImgIdx(i)}
                        style={{
                          width: 48, height: 48, flexShrink: 0, borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
                          border: imgIdx === i ? `2px solid ${C.gold}` : `1px solid ${C.goldBorder}`,
                          opacity: imgIdx === i ? 1 : 0.55, transition: 'all 0.2s ease',
                        }}>
                        <img src={img} alt={`View ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Work info */}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>
                    {artist.name}
                  </div>
                  <div style={{ fontFamily: gF, fontSize: 20, color: C.cream, marginBottom: 8, lineHeight: 1.3 }}>
                    {selectedWork.title}
                  </div>
                  <div style={{ fontFamily: gF, fontSize: 32, color: C.gold, marginBottom: 12 }}>
                    R {selectedWork.price.toLocaleString('en-ZA')}
                  </div>
                  {/* Variants if any */}
                  {(selectedWork.variants||[]).length > 1 && (
                    <div style={{ fontSize: 11, color: C.fog, lineHeight: 1.7, marginBottom: 14, padding: '8px 12px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4 }}>
                      <strong style={{ color: C.gold }}>This folio contains {selectedWork.variants.length} individual works:</strong>
                      <br />{(selectedWork.variants||[]).map(v => `${v.label} (R ${v.price.toLocaleString('en-ZA')})`).join(' · ')}
                    </div>
                  )}
                  {/* Basket button */}
                  <button
                    onClick={() => swBasketWork && toggleBasket && toggleBasket(swBasketWork)}
                    style={{
                      width: '100%', padding: '12px',
                      background: swInBasket ? 'linear-gradient(135deg, #3a7a52, #2a5a3a)' : `linear-gradient(135deg, ${C.gold}, #a07828)`,
                      border: 'none', borderRadius: 4, color: '#fff',
                      fontFamily: sF, fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      transition: 'all 0.25s ease',
                    }}>
                    {swInBasket ? '✓ Added to Backing Selection' : '+ Add to Backing Selection'}
                  </button>
                  {/* Admin controls */}
                  {isAdmin && selectedWork.status === 'available' && (
                    <button
                      onClick={() => { onMarkSold && onMarkSold(selectedWork, artist.id, artist.name); }}
                      disabled={loadingKey === `${artist.id}|${selectedWork.title}`}
                      style={{
                        width: '100%', marginTop: 8, padding: '10px',
                        background: 'rgba(176,64,64,0.15)', border: '1px solid rgba(176,64,64,0.5)',
                        borderRadius: 4, color: '#e07070', fontFamily: sF, fontSize: 10,
                        fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                      ✕ Mark as Sold
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Live Calculator ── */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid, overflow: 'hidden' }}>
              <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
                  Backing Calculator
                </div>
                {!selectedWork ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: C.fog, fontSize: 12 }}>
                    Select a work to calculate
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: gF, fontSize: 16, color: C.cream, marginBottom: 16 }}>
                      R {selectedWork.price.toLocaleString('en-ZA')}
                    </div>
                    {/* Fee info */}
                    <div style={{ padding: '10px 12px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                        <span style={{ color: C.fog }}>Backing fee ({(getDepositPct(av)*100).toFixed(0)}%)</span>
                        <span style={{ color: C.gold, fontWeight: 600 }}>R {fmt(Math.round(av * getDepositPct(av)))}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: C.fog }}>Auction platform fee/mo</span>
                        <span style={{ color: C.gold, fontWeight: 600 }}>R {fmt(Math.round(av * (0.5 - getDepositPct(av)) / 24))}</span>
                      </div>
                    </div>
                    {/* Expected sale */}
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>
                        Expected Sale Price
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.ink }}>
                        <span style={{ padding: '0 10px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 40, display: 'flex', alignItems: 'center', fontSize: 13 }}>R</span>
                        <input type="text" inputMode="decimal" value={calcSaleVal}
                          onChange={e => setCalcSaleVal(e.target.value.replace(/[^0-9.]/g,''))}
                          placeholder={selectedWork.price.toLocaleString('en-ZA')}
                          style={{ flex: 1, padding: '0 10px', height: 40, background: 'transparent', border: 'none', color: C.cream, fontFamily: sF, fontSize: 14, outline: 'none', textAlign: 'right' }}
                        />
                      </div>
                    </div>
                    {/* Month sold */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>
                        Month Sold (1–{TERM_MONTHS})
                      </label>
                      <input type="text" inputMode="decimal" value={calcMonths}
                        onChange={e => setCalcMonths(e.target.value)}
                        onBlur={e => setCalcMonths(String(Math.max(1, Math.min(parseInt(e.target.value)||TERM_MONTHS, TERM_MONTHS))))}
                        placeholder={String(TERM_MONTHS)}
                        style={{ width: '100%', padding: '10px 12px', background: C.ink, border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none', textAlign: 'right' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Results */}
              {deal && (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ height: 1, background: C.goldBorder, margin: '0 0 14px' }} />
                  {[
                    ['Monthly auction fee', `R ${fmt(deal.monthly)}`, C.gold],
                    ['Fees paid to date', `R ${fmt(deal.feesPaid)}`, C.goldLight],
                    ['Total paid to date', `R ${fmt(deal.totalPaid)}`, C.goldLight],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                      <span style={{ color: C.fog }}>{label}</span>
                      <span style={{ color, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: C.goldBorder, margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: C.fog, fontWeight: 600 }}>Your share at sale</span>
                    <span style={{ fontFamily: gF, fontSize: 22, color: C.green }}>R {fmt(deal.backerShare)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: C.fog }}>Net profit</span>
                    <span style={{ fontSize: 13, color: deal.netReturn >= 0 ? C.green : C.red, fontWeight: 600 }}>
                      {deal.netReturn >= 0 ? '+' : ''}R {fmt(deal.netReturn)}
                    </span>
                  </div>
                  {/* Scenario pills */}
                  <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.fog, marginBottom: 8 }}>All months</div>
                  <div style={{ maxHeight: 140, overflowY: 'auto', fontSize: 11 }}>
                    {av > 0 ? Array.from({length: TERM_MONTHS}, (_,i) => {
                      const s = calcBacking(av, sp, i + 1);
                      const isSel = (i + 1) === (parseInt(calcMonths) || TERM_MONTHS);
                      return (
                        <div key={i} onClick={() => setCalcMonths(String(i + 1))}
                          style={{
                            display: 'flex', justifyContent: 'space-between', padding: '4px 8px',
                            borderRadius: 3, cursor: 'pointer', marginBottom: 2,
                            background: isSel ? C.goldDim : 'transparent',
                          }}>
                          <span style={{ color: isSel ? C.gold : C.fog }}>Mo {i+1}{isSel?' ◆':''}</span>
                          <span style={{ color: C.green }}>R {fmt(s.backerShare)}</span>
                        </div>
                      );
                    }) : null}
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.goldBorder}`, fontSize: 10, color: C.fog, lineHeight: 1.6 }}>
                <strong style={{ color: C.gold }}>FAIS:</strong> Display license only. Not an investment product.
              </div>
            </div>

            {/* Gallery link */}
            {artist.galleryUrl && (
              <a href={artist.galleryUrl} target="_blank" rel="noreferrer" style={{
                display: 'block', marginTop: 10, padding: '10px', textAlign: 'center',
                border: `1px solid ${C.goldBorder}`, borderRadius: 4,
                color: C.fog, fontFamily: sF, fontSize: 10, letterSpacing: '0.1em', textDecoration: 'none',
              }}>View on Gallery Website ↗</a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── BACKING / CALCULATOR ─────────────────────────────────────────────
function BackingPage({ preloadWork, preloadBasket }) {
  const [manualVal, setManualVal] = useState('');
  const [manualSale, setManualSale] = useState('');
  const [mode, setMode] = useState('manual');
  const [selArtist, setSelArtist] = useState('');
  const [selWork, setSelWork] = useState('');

  // Build list of artworks to show — basket takes priority
  const basketItems = (preloadBasket && preloadBasket.length > 0)
    ? preloadBasket
    : (preloadWork ? [preloadWork] : []);

  useEffect(() => {
    if (preloadWork && basketItems.length === 1) {
      setManualVal(String(preloadWork.price || ''));
    }
  }, [preloadWork]);

  const artist = ARTISTS.find(a => a.id === selArtist);
  const work = artist?.works[parseInt(selWork)];
  useEffect(() => { if (work) setManualVal(String(work.price || '')); }, [selWork]);

  // Manual mode single calc
  const av = parseFloat(manualVal) || 0;
  const sp = parseFloat(manualSale) || av;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: C.ink }}>

      {/* Header */}
      <div style={{ padding: '56px 40px 40px', borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.40em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
            Backer Platform · Auction Calculator
          </div>
          <h1 style={{ fontFamily: gF, fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 300, color: C.cream, letterSpacing: '0.04em', marginBottom: 16 }}>
            {basketItems.length > 0 ? `Your Backing Selection — ${basketItems.length} Artwork${basketItems.length > 1 ? 's' : ''}` : 'Model Your Backing Deal'}
          </h1>
          {/* Phase strip */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 11, color: C.fog }}>
            {[
              { label: 'Months 1–24', desc: '20% backing fee + 30% auction platform fee · 50/50 split at sale', color: C.gold },
              { label: 'Month 25+', desc: 'Fully paid off · 100% of sale price to backer · Year 3 free on platform', color: C.green },
              { label: 'Month 37+', desc: 'Physical artwork returned to backer', color: C.goldLight },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                <span style={{ color: p.color, fontWeight: 600 }}>{p.label}</span>
                <span>— {p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── If basket has items, show each with full breakdown ── */}
        {basketItems.length > 0 ? (
          <>
            {/* Combined summary bar */}
            {basketItems.length > 1 && (() => {
              const totalVal = basketItems.reduce((s,w) => s+(w.price||0), 0);
              const totalDeposit = basketItems.reduce((s,w) => s+((w.price||0)*getDepositPct(w.price||0)), 0);
              const totalMonthly = basketItems.reduce((s,w) => s+Math.round((w.price||0)*(0.5-getDepositPct(w.price||0))/24), 0);
              const totalShare = basketItems.reduce((s,w) => s+((w.price||0)*0.5), 0);
              const totalMaxReturn = basketItems.reduce((s,w) => {
                const d = calcBacking(w.price||0, w.price||0, 1);
                return s + d.netReturn;
              }, 0);
              return (
                <div style={{ padding: '20px 28px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid, marginBottom: 32, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 20 }}>
                  {[
                    ['Total Artwork Value', `R ${fmt(totalVal)}`, C.cream],
                    ['Combined Backing Fee', `R ${fmt(totalDeposit)}`, C.gold],
                    ['Combined Fee/Month', `R ${fmt(totalMonthly)}`, C.goldLight],
                    ['Combined 50% Share', `R ${fmt(totalShare)}`, C.green],
                    ['Max Combined Return', `+R ${fmt(totalMaxReturn)}`, C.green],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 8 }}>{label}</div>
                      <div style={{ fontFamily: gF, fontSize: 22, color }}>{val}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Each artwork with its own full 24-month table */}
            {basketItems.map((bw, bi) => {
              const price = bw.price || 0;
              const depositPct = getDepositPct(price);
              const deposit = price * depositPct;
              const monthly = price * (0.5 - depositPct) / TERM_MONTHS;
              const share50 = price * 0.5;
              const months = Array.from({length: TERM_MONTHS}, (_, i) => ({
                month: i + 1,
                ...calcBacking(price, price, i + 1),
              }));

              return (
                <div key={bi} style={{ marginBottom: 40, border: `1px solid ${C.goldBorder}`, borderRadius: 8, background: C.inkMid, overflow: 'hidden' }}>
                  {/* Artwork header */}
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.goldBorder}`, background: C.ink }}>
                    <div style={{ width: 72, height: 72, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.goldBorder}` }}>
                      <img src={bw.image} alt={bw.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold, marginBottom: 4 }}>{bw.artistName}</div>
                      <div style={{ fontFamily: gF, fontSize: 20, color: C.cream, marginBottom: 4 }}>{bw.title}</div>
                      <div style={{ fontFamily: gF, fontSize: 24, color: C.gold }}>R {fmt(price)}</div>
                    </div>
                    {/* Key metrics */}
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Backing Fee', val: `R ${fmt(deposit)}`, sub: `${(depositPct*100).toFixed(0)}% upfront · you own it` },
                        { label: 'Auction Fee/mo', val: `R ${fmt(monthly)}`, sub: '× 24 months' },
                        { label: '50% at Sale', val: `R ${fmt(share50)}`, sub: 'received when sold' },
                        { label: 'Max Return', val: `+R ${fmt(months[0].netReturn)}`, sub: 'if sold month 1', green: true },
                      ].map(card => (
                        <div key={card.label} style={{ padding: '12px 16px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, textAlign: 'center', minWidth: 110 }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.fog, marginBottom: 6 }}>{card.label}</div>
                          <div style={{ fontFamily: gF, fontSize: 18, color: card.green ? C.green : C.gold, marginBottom: 2 }}>{card.val}</div>
                          <div style={{ fontSize: 9, color: C.fog }}>{card.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 24-month table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {['Month', 'Backing Fee', 'Fees Paid', 'Total Paid', '50% Share', 'Net Return'].map((h, i) => (
                            <th key={h} style={{
                              padding: '10px 16px', textAlign: i > 0 ? 'right' : 'left',
                              fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                              color: C.fog, borderBottom: `1px solid ${C.goldBorder}`,
                              background: C.inkMid,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {months.map(s => (
                          <tr key={s.month} style={{ background: s.month % 2 === 0 ? 'rgba(201,168,76,0.03)' : 'transparent' }}>
                            <td style={{ padding: '9px 16px', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.cream, fontWeight: 500 }}>
                              Month {s.month}
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.fog }}>
                              R {fmt(s.deposit)}
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.fog }}>
                              R {fmt(s.feesPaid)}
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.goldLight }}>
                              R {fmt(s.totalPaid)}
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.gold, fontWeight: 600 }}>
                              R {fmt(s.backerShare)}
                            </td>
                            <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, fontFamily: gF, fontSize: 15,
                              color: s.netReturn >= 0 ? C.green : C.red, fontWeight: 600 }}>
                              {s.netReturn >= 0 ? '+' : ''}R {fmt(s.netReturn)}
                            </td>
                          </tr>
                        ))}
                        {/* Month 25 note */}
                        <tr style={{ background: 'rgba(90,170,122,0.06)' }}>
                          <td colSpan={6} style={{ padding: '12px 16px', color: C.green, fontSize: 11, lineHeight: 1.7 }}>
                            ★ <strong>From Month 25</strong> — fully paid off. Take the physical artwork or keep on platform free for 1 year. Any sale = <strong>100% to backer</strong>.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          /* ── Manual entry mode ── */
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 40 }}>
            <div>
              {/* Mode toggle */}
              <div style={{ display: 'flex', marginBottom: 16, border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden' }}>
                {[['manual','Manual Entry'],['gallery','From Gallery']].map(([id,label]) => (
                  <button key={id} onClick={() => setMode(id)} style={{
                    flex: 1, padding: '11px 0', fontFamily: sF, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', border: 'none',
                    background: mode === id ? `linear-gradient(135deg, ${C.gold}, #a07828)` : C.inkMid,
                    color: mode === id ? '#1a2744' : C.fog,
                  }}>{label}</button>
                ))}
              </div>
              {mode === 'gallery' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 7 }}>Artist</label>
                  <select value={selArtist} onChange={e => { setSelArtist(e.target.value); setSelWork(''); }}
                    style={{ width: '100%', padding: '11px 14px', background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 13, outline: 'none', appearance: 'none', marginBottom: 10 }}>
                    <option value="">— Select artist</option>
                    {ARTISTS.filter(a => (a.works||[]).some(w => w.status==='available')).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {artist && (
                    <>
                      <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 7 }}>Artwork</label>
                      <select value={selWork} onChange={e => setSelWork(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 12, outline: 'none', appearance: 'none' }}>
                        <option value="">— Select artwork</option>
                        {(artist.works||[]).filter(w => w.status==='available').map((w,i) => (
                          <option key={i} value={String(i)}>{w.title} — R {fmt(w.price)}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 7 }}>Recommended Selling Price (R)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.inkMid }}>
                  <span style={{ padding: '0 12px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 46, display: 'flex', alignItems: 'center' }}>R</span>
                  <input type="text" inputMode="decimal" value={manualVal}
                    onChange={e => setManualVal(e.target.value.replace(/[^0-9.]/g,''))}
                    placeholder="e.g. 100 000"
                    style={{ flex: 1, padding: '0 14px', height: 46, background: 'transparent', border: 'none', color: C.cream, fontFamily: sF, fontSize: 16, outline: 'none', textAlign: 'right' }} />
                </div>
                {av > 0 && <div style={{ fontSize: 10, color: C.fog, marginTop: 5, textAlign: 'right' }}>Backing fee tier: {(getDepositPct(av)*100).toFixed(0)}%</div>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 7 }}>
                  Expected Auction Price <span style={{ color: C.fog, textTransform: 'none', letterSpacing: 0 }}>optional</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C.goldBorder}`, borderRadius: 4, overflow: 'hidden', background: C.inkMid }}>
                  <span style={{ padding: '0 12px', color: C.fog, borderRight: `1px solid ${C.goldBorder}`, height: 46, display: 'flex', alignItems: 'center' }}>R</span>
                  <input type="text" inputMode="decimal" value={manualSale}
                    onChange={e => setManualSale(e.target.value.replace(/[^0-9.]/g,''))}
                    placeholder={manualVal || 'same as selling price'}
                    style={{ flex: 1, padding: '0 14px', height: 46, background: 'transparent', border: 'none', color: C.cream, fontFamily: sF, fontSize: 16, outline: 'none', textAlign: 'right' }} />
                </div>
              </div>
              <div style={{ padding: '12px 14px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, fontSize: 10, color: C.fog, lineHeight: 1.7 }}>
                <strong style={{ color: C.gold }}>Legal note:</strong> Backer platform arrangement. Auction platform fees fund online auctions, live auctions and exhibitions at the gallery's discretion. Not a financial investment product.
              </div>
            </div>

            {/* Manual results */}
            <div>
              {av <= 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 40px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid }}>
                  <div style={{ fontFamily: gF, fontSize: 48, color: C.gold, opacity: 0.12, marginBottom: 16 }}>◆</div>
                  <div style={{ fontFamily: gF, fontSize: 18, color: C.fog, fontWeight: 300 }}>Enter a recommended selling price to model your deal</div>
                  <div style={{ fontSize: 12, color: C.fog, marginTop: 8, opacity: 0.7 }}>Or browse artists and add artworks to your backing selection</div>
                </div>
              ) : (() => {
                const depositPct = getDepositPct(av);
                const deposit = av * depositPct;
                const monthly = av * (0.5 - depositPct) / TERM_MONTHS;
                const share50 = sp * 0.5;
                const months = Array.from({length: TERM_MONTHS}, (_, i) => ({
                  month: i + 1, ...calcBacking(av, sp, i + 1),
                }));
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                      {[
                        { label: 'Backing Fee', val: `R ${fmt(deposit)}`, sub: `${(depositPct*100).toFixed(0)}% upfront`, color: C.gold },
                        { label: 'Auction Fee/mo', val: `R ${fmt(monthly)}`, sub: '× 24 months', color: C.goldLight },
                        { label: '50% at Sale', val: `R ${fmt(share50)}`, sub: 'when artwork sells', color: C.green },
                        { label: 'Max Return', val: `+R ${fmt(months[0].netReturn)}`, sub: 'if sold month 1', color: C.green },
                      ].map(card => (
                        <div key={card.label} style={{ padding: '18px 12px', border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid, textAlign: 'center' }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.fog, marginBottom: 8 }}>{card.label}</div>
                          <div style={{ fontFamily: gF, fontSize: 22, color: card.color, marginBottom: 4 }}>{card.val}</div>
                          <div style={{ fontSize: 9, color: C.fog }}>{card.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 6, background: C.inkMid, overflow: 'hidden' }}>
                      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.goldBorder}`, display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold }}>24-Month Schedule</div>
                        <div style={{ fontSize: 10, color: C.fog }}>Max return Month 1 · Break even Month 24</div>
                      </div>
                      <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead>
                            <tr>
                              {['Month','Backing Fee','Fees Paid','Total Paid','50% Share','Net Return'].map((h,i) => (
                                <th key={h} style={{ padding: '10px 16px', textAlign: i>0?'right':'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.fog, borderBottom: `1px solid ${C.goldBorder}`, background: C.inkMid }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {months.map(s => (
                              <tr key={s.month} style={{ background: s.month%2===0?'rgba(201,168,76,0.03)':'transparent' }}>
                                <td style={{ padding: '9px 16px', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.cream, fontWeight: 500 }}>Month {s.month}</td>
                                <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.fog }}>R {fmt(s.deposit)}</td>
                                <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.fog }}>R {fmt(s.feesPaid)}</td>
                                <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.goldLight }}>R {fmt(s.totalPaid)}</td>
                                <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, color: C.gold, fontWeight: 600 }}>R {fmt(s.backerShare)}</td>
                                <td style={{ padding: '9px 16px', textAlign: 'right', borderBottom: `1px solid rgba(201,168,76,0.06)`, fontFamily: gF, fontSize: 15, color: s.netReturn>=0?C.green:C.red, fontWeight: 600 }}>
                                  {s.netReturn>=0?'+':''}R {fmt(s.netReturn)}
                                </td>
                              </tr>
                            ))}
                            <tr style={{ background: 'rgba(90,170,122,0.06)' }}>
                              <td colSpan={6} style={{ padding: '12px 16px', color: C.green, fontSize: 11, lineHeight: 1.7 }}>
                                ★ <strong>From Month 25</strong> — fully paid off. Take the artwork or keep on platform free for 1 year. Any sale = <strong>100% to backer</strong>.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── APP SHELL ────────────────────────────────────────────────────────

// ─── BACKING TRAY ────────────────────────────────────────────────────
function BackingTray({ basket, toggleBasket, onOpenCalc, setCalcWork, setCalcBasket }) {
  const [open, setOpen] = useState(false);
  if (!basket || basket.length === 0) return null;

  // Calculate per-artwork using correct model
  const items = basket.map(w => {
    const av = w.price || 0;
    const depositPct = getDepositPct(av);
    const deposit = av * depositPct;
    const monthly = av * (0.50 - depositPct) / TERM_MONTHS;
    const backerShare = av * 0.50; // at sale, 50% of recommended price
    return { ...w, deposit, monthly, backerShare };
  });

  const totalValue = items.reduce((s, w) => s + (w.price || 0), 0);
  const totalDeposit = items.reduce((s, w) => s + w.deposit, 0);
  const totalMonthly = items.reduce((s, w) => s + w.monthly, 0);
  const totalShare = items.reduce((s, w) => s + w.backerShare, 0);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 400,
        background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
        border: 'none', borderRadius: 50, padding: '14px 22px',
        color: '#1a2744', fontFamily: sF, fontSize: 12, fontWeight: 700,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        cursor: 'pointer', boxShadow: '0 8px 32px rgba(201,168,76,0.5)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          background: '#1a2744', color: C.gold, borderRadius: '50%',
          width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900,
        }}>{basket.length}</span>
        Backing Selection · R {totalValue.toLocaleString('en-ZA')}
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 450, display: 'flex', justifyContent: 'flex-end', background: 'rgba(10,16,32,0.7)' }}
          onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 480, background: C.inkMid,
            borderLeft: `1px solid ${C.goldBorder}`, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: `1px solid ${C.goldBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.ink }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>Your Backing Selection</div>
                <div style={{ fontFamily: gF, fontSize: 22, color: C.cream }}>{basket.length} Artwork{basket.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: C.fog, fontSize: 28, cursor: 'pointer' }}>×</button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {items.map((work, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: `1px solid ${C.goldBorder}` }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: C.ink }}>
                      <img src={work.image} alt={work.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 2 }}>{work.artistName}</div>
                      <div style={{ fontSize: 12, color: C.cream, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{work.title}</div>
                    </div>
                    <button onClick={() => toggleBasket(work)} style={{ background: 'none', border: '1px solid rgba(176,64,64,0.4)', borderRadius: 3, color: '#e07070', fontSize: 11, padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}>Remove</button>
                  </div>
                  {/* Per-artwork breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {[
                      ['Backing fee', `R ${fmt(work.deposit)}`],
                      ['Auction fee/mo', `R ${fmt(work.monthly)}`],
                      ['50% at sale', `R ${fmt(work.backerShare)}`],
                    ].map(([label, val]) => (
                      <div key={label} style={{ padding: '8px 10px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: C.fog, marginBottom: 3, letterSpacing: '0.1em' }}>{label}</div>
                        <div style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ padding: '20px 24px', borderTop: `1px solid ${C.goldBorder}`, background: C.ink }}>
              <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold, marginBottom: 14 }}>Combined Totals</div>
              {[
                ['Total artwork value', `R ${fmt(totalValue)}`, false],
                ['Total backing fee (upfront)', `R ${fmt(totalDeposit)}`, false],
                ['Combined auction fee/mo', `R ${fmt(totalMonthly)}`, false],
                ['Your combined 50% at sale', `R ${fmt(totalShare)}`, true],
              ].map(([label, val, highlight], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 3 ? `1px solid rgba(201,168,76,0.1)` : 'none' }}>
                  <span style={{ fontSize: 12, color: C.fog }}>{label}</span>
                  <span style={{ fontFamily: highlight ? gF : sF, fontSize: highlight ? 20 : 13, color: highlight ? C.green : C.gold, fontWeight: highlight ? 400 : 600 }}>{val}</span>
                </div>
              ))}
              <div style={{ fontSize: 10, color: C.fog, lineHeight: 1.6, margin: '16px 0', padding: '10px', background: C.goldGlow, border: `1px solid ${C.goldBorder}`, borderRadius: 4 }}>
                <strong style={{ color: C.gold }}>FAIS:</strong> Backer platform arrangement. Auction platform fees fund online auctions, live auctions and exhibitions. Not a financial investment product.
              </div>
              <button onClick={() => { setOpen(false); if(setCalcBasket) setCalcBasket(basket); if (basket[0]) setCalcWork(basket[0]); onOpenCalc(); }}
                style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${C.gold}, #a07828)`, border: 'none', borderRadius: 4, color: '#1a2744', fontFamily: sF, fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Open Backing Calculator →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── ADMIN LOGIN MODAL ───────────────────────────────────────────────
function AdminLogin({ onLogin, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!sb) { setError('Supabase not configured'); return; }
    setLoading(true); setError('');
    const { error: e } = await sb.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); }
    else { onLogin(); onClose(); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(10,16,32,0.96)', zIndex: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.inkMid, border: `1px solid ${C.goldBorder}`, borderRadius: 8,
        padding: 36, width: '100%', maxWidth: 400,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold}, transparent)`, borderRadius: 2, marginBottom: 28 }} />
        <div style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
          Admin Access
        </div>
        <div style={{ fontFamily: gF, fontSize: 26, color: C.cream, marginBottom: 28 }}>Sign In</div>
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(176,64,64,0.15)', border: '1px solid rgba(176,64,64,0.4)', borderRadius: 4, fontSize: 12, color: '#e07070', marginBottom: 16 }}>
            {error}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: '100%', padding: '12px 14px', background: C.ink, border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 14, outline: 'none' }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ width: '100%', padding: '12px 14px', background: C.ink, border: `1px solid ${C.goldBorder}`, borderRadius: 4, color: C.cream, fontFamily: sF, fontSize: 14, outline: 'none' }}
          />
        </div>
        <button onClick={submit} disabled={loading} className="gold-btn" style={{
          width: '100%', padding: '14px', background: `linear-gradient(135deg, ${C.gold}, #a07828)`,
          border: 'none', borderRadius: 4, color: '#1a2744', fontFamily: sF,
          fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <button onClick={onClose} style={{
          width: '100%', marginTop: 10, padding: '10px', background: 'transparent',
          border: 'none', color: C.fog, fontFamily: sF, fontSize: 12, cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function WinelandsBackers() {
  const [page, setPage] = useState('home');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [calcWork, setCalcWork] = useState(null);
  const [calcBasket, setCalcBasket] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [soldOverrides, setSoldOverrides] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [basket, setBasket] = useState([]);

  const toggleBasket = (work) => {
    const key = `${work.artistId}|${work.title}|${work.image}`;
    setBasket(prev => {
      const exists = prev.find(w => `${w.artistId}|${w.title}|${w.image}` === key);
      return exists ? prev.filter(w => `${w.artistId}|${w.title}|${w.image}` !== key) : [...prev, work];
    });
  };
  const inBasket = (work) => basket.some(w => `${w.artistId}|${w.title}|${w.image}` === `${work.artistId}|${work.title}|${work.image}`);

  // Check auth on mount + load sold overrides
  useEffect(() => {
    const init = async () => {
      if (!sb) return;
      let session = null;
      try { const r = await sb.auth.getSession(); session = r?.data?.session; } catch(e) {}
      if (session?.user) {
        try {
          const { data } = await sb.from('admin_profiles').select('id').eq('id', session.user.id).maybeSingle();
          if (data) setIsAdmin(true);
        } catch(e) {}
      }
      // Load all sold overrides
      let statuses = null;
      try { const r = await sb.from('artwork_status').select('artwork_key, status'); statuses = r?.data; } catch(e) {}
      if (statuses) {
        const map = {};
        statuses.forEach(s => { map[s.artwork_key] = s.status; });
        setSoldOverrides(map);
      }
    };
    init();
    if (!sb) return;
    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await sb.from('admin_profiles').select('id').eq('id', session.user.id).maybeSingle();
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const markSold = async (work, artistId, artistName) => {
    if (!sb || !isAdmin) return;
    const key = artKey(artistId, work.title);
    setLoadingKey(key);
    const payload = {
      artwork_key: key, artist_id: artistId, artist_name: artistName,
      title: work.title, price: work.price, status: 'sold',
    };
    await sb.from('artwork_status').upsert(payload, { onConflict: 'artwork_key' });
    setSoldOverrides(prev => ({ ...prev, [key]: 'sold' }));
    setLoadingKey(null);
  };

  const markAvailable = async (work, artistId) => {
    if (!sb || !isAdmin) return;
    const key = artKey(artistId, work.title);
    setLoadingKey(key);
    await sb.from('artwork_status').delete().eq('artwork_key', key);
    setSoldOverrides(prev => { const n = { ...prev }; delete n[key]; return n; });
    setLoadingKey(null);
  };

  const signOut = async () => { if (sb) await sb.auth.signOut(); setIsAdmin(false); };

  const getWorkStatus = (work, artistId) => {
    const k = artKey(artistId, work.title);
    return soldOverrides[k] || work.status || 'available';
  };

  const openCalculator = (work) => {
    setCalcWork(work);
    navigateTo('backing');
  };

  const navigateTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <GlobalStyles />
      <Nav page={page} setPage={navigateTo} isAdmin={isAdmin} onAdminLogin={() => setShowLogin(true)} onSignOut={signOut} />
      {showLogin && <AdminLogin onLogin={() => setIsAdmin(true)} onClose={() => setShowLogin(false)} />}
      <BackingTray basket={basket} toggleBasket={toggleBasket} onOpenCalc={() => navigateTo('backing')} setCalcWork={setCalcWork} setCalcBasket={setCalcBasket} />
      {page === 'home' && <HomePage setPage={navigateTo} />}
      {page === 'artists' && <ArtistsPage setSelectedArtist={setSelectedArtist} setPage={navigateTo} />}
      {page === 'artist-detail' && (
        <ArtistDetail
          artist={selectedArtist}
          setPage={navigateTo}
          onOpenCalc={openCalculator}
          isAdmin={isAdmin}
          getWorkStatus={getWorkStatus}
          onMarkSold={markSold}
          onMarkAvailable={markAvailable}
          loadingKey={loadingKey}
          basket={basket}
          toggleBasket={toggleBasket}
          inBasket={inBasket}
        />
      )}
      {page === 'backing' && <BackingPage preloadWork={calcWork} preloadBasket={calcBasket} />}
    </>
  );
}
