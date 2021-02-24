/**
 * custom Repository
 */
import { EntityRepository, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {
  async getOrCreate(name: string): Promise<Category> {
    // categoryName, categorySlug 생성
    const categoryName = name.replace(/  +/g, ' ').trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');

    // categorySlug가 이미 만들어져있는지 판단 후 Restaurant인스턴스에 추가
    let category = await this.findOne({ slug: categorySlug });
    if (!category) {
      category = await this.save(
        this.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
}
