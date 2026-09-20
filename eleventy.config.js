export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/static": "." });
  eleventyConfig.addWatchTarget("src/static");
  return { dir: { input: "src", output: "_site", data: "_data" }, templateFormats: ["njk"], htmlTemplateEngine: "njk" };
}
