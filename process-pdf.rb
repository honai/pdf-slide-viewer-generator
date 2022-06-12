require "json"

require "pdf-reader"

def generate_pdf_images(pdf_file, output_prefix)
  command = "pdftoppm -jpeg -scale-to 1280 #{pdf_file.to_s} #{output_prefix}"
  puts command
  if !system(command)
    raise RuntimeError
  end
end

def extract_links(page, reader)
  (page.attributes[:Annots] || [])
    .map do |ref_to_annotation|
      # page.attributesに含まれるのは実際のannotation objectへの参照であるため、参照先を見る
      reader.objects[ref_to_annotation]
    end
    .filter do |annotation|
      # URI Actionに対するLink Annotationだけを選択
      annotation[:Subtype] == :Link && annotation[:A][:S] == :URI
    end
    .map do |annotation|
      # Annotationの位置と、リンク先URLを抽出
      { rect: annotation[:Rect], url: annotation[:A][:URI] }
    end
end

def rectangle_to_css_position(rect, width, height)
  # rectは [左端のx, 下端のy, 右端のx, 上端のy] すべて左下が原点
  # width, heightはページの幅と高さ
  {
    top: (height - rect[3]) / height,
    left: rect[0] / width,
    bottom: rect[1] / height,
    right: (width - rect[2]) / width
  }.map { |k, v| [k, "#{(v * 100).round(2)}%"] }.to_h.map{|k,v| "#{k}:#{v};"}.join("")
end

def parse_pdf(pdf_file, image_prefix, image_ext)
  reader = PDF::Reader.new(pdf_file)
  # pdftoppm generate images with page number (0-padding, 1-indexed)
  # so we have to pad index with 0
  idx_pad_len = (reader.pages.length + 1).to_s.length
  pages = reader.pages.map.with_index do |page, idx|
    idx_str = (idx + 1).to_s.rjust(idx_pad_len, "0")
    {
      text: page.text.gsub(/\s+/, " "),
      width: page.width,
      height: page.height,
      image: "#{image_prefix}#{idx_str}#{image_ext}",
      links: extract_links(page, reader).map{ |link| { url: link[:url], position_str: rectangle_to_css_position(
        link[:rect], page.width, page.height
      ) } }
    }
  end
  title = reader.info[:title] || pages[0][:text]
  { title: title, pages: pages }
end

def main
  dir = Pathname(__dir__)
  pdf_dir = dir.join("assets/pdf")
  output_dir = dir.join("_slides")
  slide_image_dir = dir.join("assets/slide-images")

  pdf_dir.glob("*.pdf").each do |pdf_file|
    # pdf file name w/o extension
    pdf_name = pdf_file.basename(".pdf").to_s

    slide_image_target_dir = slide_image_dir.join(pdf_name)
    if not slide_image_target_dir.exist?
      Dir.mkdir(slide_image_target_dir)
      generate_pdf_images(pdf_file, "#{slide_image_target_dir.to_s}/slide")
    end

    out_markdown_file = output_dir.join("#{pdf_name}.md")
    if not out_markdown_file.exist?
      data = parse_pdf(pdf_file, "#{pdf_name}/slide-", ".jpg")
      out_markdown_file.write("---\n#{JSON.pretty_generate(data)}\n---\n")
    end
  end
end

main()
