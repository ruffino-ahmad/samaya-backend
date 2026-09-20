import slugify from "slugify";
import EventModel from "../modules/event/event.model";

export const generateBaseSlug = (text: string): string => {
  const formatted = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  return formatted || `event-${Date.now()}`;
};

export const resolvingUniqueSlug = async (
  name: string,
  excludedId?: string,
): Promise<string> => {
  const baseSlug = generateBaseSlug(name);

  const regex = new RegExp(`^${baseSlug}(-[0-9]+)?$`, "i");

  const existingEvents = await EventModel.find({
    slug: regex,
    ...(excludedId && {
      _id: {
        $ne: excludedId,
      },
    }),
  })
    .select("slug")
    .lean();

  if (existingEvents.length === 0) {
    return baseSlug;
  }

  const existingSlugs = new Set(existingEvents.map((e) => e.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
};
