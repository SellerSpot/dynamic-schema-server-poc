import express from 'express';
import mongoose, { Schema, connection } from 'mongoose';
import morgan from 'morgan';

const app = express();
app.use(express.json());
app.use(morgan('dev'));

const port = 6000;
const baseDbString = 'dynamic-schema-test';
const mongooseConnectionUrl = `mongodb://localhost:27017/${baseDbString}`;

const mongooseConnection = mongoose.createConnection(mongooseConnectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

type TFieldType = 'number' | 'string';

type IFieldStrcutre = { name: string; type: TFieldType };

const getFieldType = (type: TFieldType) => {
    switch (type) {
        case 'number':
            return Schema.Types.Number;
        case 'string':
        default:
            return Schema.Types.String;
    }
};

const getSchemaDefinitionsFromFieldStructure = (fieldStructure: IFieldStrcutre[]) => {
    return fieldStructure.reduce((resultDefinition, currentField) => {
        resultDefinition[currentField.name] = getFieldType(currentField.type);
        return resultDefinition;
    }, <{ [key: string]: ReturnType<typeof getFieldType> }>{});
};

const checkAndRegisterShema = (
    dbInstance: typeof connection,
    modelName: string,
    fieldStructure: IFieldStrcutre[],
) => {
    // delete schema if already register
    if (dbInstance.modelNames().includes(modelName)) dbInstance.deleteModel(modelName);

    // create schema from request modelStructure object
    const sampleSchema = new Schema(getSchemaDefinitionsFromFieldStructure(fieldStructure), {
        timestamps: true,
    });

    dbInstance.model(modelName, sampleSchema);
};

app.post('/', async (req, res) => {
    const { modelName, fieldStructure } = req.body as {
        modelName: string;
        query: string;
        fieldStructure: IFieldStrcutre[];
    };

    const dbInstnce = mongooseConnection.useDb(baseDbString); // select tenant db

    checkAndRegisterShema(dbInstnce, modelName, fieldStructure);

    if (modelName === 'taxbracket') {
        const TaxBracktModel = dbInstnce.model(modelName);
        TaxBracktModel.create({
            name: 'GST',
            percentage: 18,
        });
    } else if (modelName === 'sample') {
        const SampleModel = dbInstnce.model(modelName);
        const data = await SampleModel.find();
        return res.send({
            status: true,
            data,
        });
    }

    res.send({
        status: true,
        data: 'success',
    });
});

app.listen(port, () => console.log('server started at port', port));
