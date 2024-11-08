import type {
  UnknownKeysParam,
  ZodEffects,
  ZodObject,
  ZodRawShape,
  ZodTypeAny,
} from "zod";

export async function validateFields<
  Shape extends ZodRawShape,
  Keys extends UnknownKeysParam,
  Type extends ZodTypeAny,
  Data,
>(
  formData: FormData,
  schema:
    | ZodObject<Shape, Keys, Type, Data>
    | ZodEffects<ZodObject<Shape, Keys, Type, Data>>,
): Promise<[Feedback<Data>, null] | [null, Data]> {
  const result = await schema.safeParseAsync(Object.fromEntries(formData));

  if (result.success) {
    return [null, result.data];
  }

  const feedback = result.error.errors.reduce((feedback, error) => {
    const field = error.path[0] as keyof Data;

    if (field && !feedback[field]) {
      feedback[field] = error.message;
    }

    return feedback;
  }, {} as Feedback<Data>);

  return [feedback, null];
}

type Feedback<T> = {
  [K in keyof T]?: string;
};
