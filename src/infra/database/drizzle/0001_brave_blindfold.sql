-- Missing hyperevm defaults for bot_settings

ALTER TABLE "bot_settings" ALTER COLUMN "presets" SET DEFAULT '{"bsc":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"base":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"sonic":{"fixed":[10,25,50,75,100],"percent":[10,25,50,75,100]},"solana":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"polygon":{"fixed":[100,200,300,400,500],"percent":[10,25,50,75,100]},"arbitrum":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"ethereum":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"avalanche":{"fixed":[0.1,0.25,0.5,0.75,1],"percent":[10,25,50,75,100]},"berachain":{"fixed":[1,2.5,5,7.5,10],"percent":[10,25,50,75,100]},"hyperevm":{"fixed":[0.1,0.5,1,2,3],"percent":[10,25,50,75,100]}}'::jsonb;

ALTER TABLE "bot_settings" ALTER COLUMN "slippage_settings" SET DEFAULT '{"bsc":0.5,"base":0.5,"sonic":0.5,"solana":5,"polygon":0.5,"arbitrum":0.5,"ethereum":0.5,"avalanche":0.5,"berachain":0.5,"hyperevm":0.5}'::jsonb;

-- Only base, solana, mainnet, and hyperevm are to be enabled by default

ALTER TABLE "bot_settings" ALTER COLUMN "chains_enabled" SET DEFAULT '{"bsc":false,"base":true,"sonic":false,"solana":true,"polygon":false,"arbitrum":false,"ethereum":true,"avalanche":false,"berachain":false,"hyperevm":true}'::jsonb;
