const blockConsumer = require('../../helpers/indexer/blockConsumer');

/**
 * todo: rewrite these apis
 */

const health = (req, res, next) => {
    return res.send({ serverTime: Date.now() });
};
const pong = (req, res, next) => {
    return res.send('pong');
};

const getCurrenctIndexerConfig = async (req, res, next) => {
    // todo: fetch from psql
    return res.send({});
    // return res.send({
    //     task: JSON.stringify(task, (_key, value) => (value instanceof Set ? [...value] : value)),
    //     trackTxns: JSON.stringify(trackTxns, (_key, value) =>
    //         value instanceof Set ? [...value] : value,
    //     ),
    // });
};

const getIndexerConfig = async (req, res, next) => {
    try {
        // todo: get from psql
        // return res.send({ config: await db.indexerConfig.find().toArray() });
        return res.send({ config: [] });
    } catch (e) {
        console.error(e);
        return res.status(400).send(`could error get indexer config :: ${e.message}`);
    }
};

const addIndexerConfig = async (req, res, next) => {
    if (!req.body?.length) return res.status(400).send('array required');
    try {
        return res.send({});
        // todo: save to psql
        // await db.indexerConfig.insertMany(req.body);
        await blockConsumer.populateTaskConfig();
        return res.send('done');
    } catch (e) {
        console.error(e);
        return res.status(400).send(`could error adding indexer config :: ${e.message}`);
    }
};

const delIndexerConfig = async (req, res, next) => {
    if (!req.body.ids?.length) return res.status(400).send('ids required');

    try {
        return res.send({});
        // todo: delete from psql
        // await db.indexerConfig.deleteMany({ _id: { $in: req.body.ids.map((id) => new ObjectId(id)) } });
        await blockConsumer.populateTaskConfig();
        return res.send('done');
    } catch (e) {
        console.error(e);
        return res.status(400).send(`could error adding indexer config :: ${e.message}`);
    }
};

const Bottleneck = require('bottleneck');

const trackOldBlocks = async (req, res, next) => {
    if (!req.body.chainId) return res.status(400).send('chainId required');
    if (!req.body.blocks) return res.status(400).send('blocks required');
    try {
        return res.send({});
        const chainId = req.body.chainId.toString();
        const blocks = req.body.blocks.map((v) => v.toString());

        let tst = Date.now();
        let st = Date.now();

        const limiter = new Bottleneck({
            maxConcurrent: 300,
        });

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            limiter.schedule(() => {
                console.log('processing', i, block);
                blockConsumer._consumeBlock(chainId, block, true).catch((e) => console.error(e));
            });
        }
        console.log('waiting for tasks to finish');
        await new Promise((resolve, reject) => {
            limiter.on('idle', () => {
                console.log('All tasks have been completed');
                resolve();
            });

            // Optional: Handle possible errors in your tasks
            limiter.on('error', (error) => {
                console.error('An error occurred when processing a task:', error);
                reject(error);
            });
        });

        console.log('processing total runtime:', Math.ceil((Date.now() - tst) / 1000 / 60), 'mins');

        return res.send(`done: trackOldBlocks for ${chainId} blocks ${blocks.length}`);
    } catch (e) {
        console.error(e);
        return res.status(400).send(e);
    }
};

/**
 * currently this api is just for our internal use. It will reproduce all failed txns
 */
const reproduceFailedWebhook = async (req, res, next) => {
    try {
        return res.send({});
        const completedIds = await _produceFailedWebhook();

        // delete successful reproduce from db
        if (completedIds.length)
            // todo: delete from psql
            // await db.webhookFailedCalls.deleteMany({ _id: { $in: completedIds } });

            return res.send('reproduce complete');
    } catch (e) {
        console.error('reproduce failed', e);

        return res.status(400).send(e.message);
    }
};

const _produceFailedWebhook = async () => {
    // todo: get from psql
    // const toReproduce = await db.webhookFailedCalls.find({}).toArray();
    const toReproduce = [];
    const completed = [];
    let promises = [];
    for (let i = 0; i < toReproduce.length; i++) {
        try {
            // promises.push(webhookHelper.callWebhook(toReproduce[i]).then(() => completed.push(toReproduce[i]._id)));

            if (promises.length > 20) {
                await Promise.allSettled(promises);
                promises = [];
            }
        } catch (e) {
            console.error('reprodue failed', e);
        }
    }
    await Promise.allSettled(promises);

    return completed;
};

const clearTaskConfig = async (req, res, next) => {
    try {
        return res.send({});
        await blockConsumer.populateTaskConfig();
        return res.send('task config recached');
    } catch (e) {
        console.error(e);
        return res.status(400).send(`Could not delete cache :: ${e.message}`);
    }
};

const clearTaskRewardConfig = async (req, res, next) => {
    if (!req.body.taskIds) return res.status(400).send('taskIds required');
    try {
        return res.send({});
        for (let i = 0; i < req.body.taskIds.length; i++) {
            const taskId = req.body.taskIds[i];
            if (!taskId.startsWith('0x')) throw new Error('task id should start with 0x');
        }

        return res.send('taskConfig cache cleared');
    } catch (e) {
        console.error(e);
        return res.status(400).send(`Could not delete cache :: ${e.message}`);
    }
};

module.exports = {
    health,
    pong,
    getCurrenctIndexerConfig,
    getIndexerConfig,
    addIndexerConfig,
    delIndexerConfig,
    trackOldBlocks,

    reproduceFailedWebhook,

    clearTaskConfig,
    clearTaskRewardConfig,
};
