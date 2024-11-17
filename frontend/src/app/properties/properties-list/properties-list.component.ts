import {
  Component,
  computed,
  input,
  model,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IonInfiniteScroll } from '@ionic/angular';
import { Property } from 'src/app/shared/interface/property';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { PropertiesDisplayOption } from 'src/app/shared/enums/property';
import { PropertiesService } from '../properties.service';
import { debounce } from 'src/app/shared/utility/helpers';
import {
  filterProperties,
  searchProperties,
  sortProperties,
} from 'src/app/shared/utility/properties';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrls: ['./properties-list.component.scss'],
})
export class PropertiesListComponent implements OnInit {
  @ViewChild('IonInfiniteScroll', { static: false })
  infinityScroll: IonInfiniteScroll;

  public singleCol = input<boolean>(false);
  public horizontalSlide = input<boolean>(false);
  public limit = input<number>(0);
  public enableOwnedBadge = input<boolean>(false);
  public enablePopupOptions = input<boolean>(false);
  public displayOption = input<PropertiesDisplayOption>(
    PropertiesDisplayOption.CardView
  );
  public properties = input<Property[]>();
  public disableInfinitScroll = model(false);

  public propertiesList = computed<Property[]>(() => {
    if (!this.properties()) {
      return [];
    }
    let temp = this.limit()
      ? this.properties().slice(0, this.limit())
      : this.properties();
    const { sort, search, filter } = this.queryParams();
    if (search) temp = searchProperties(search, temp);
    if (filter) temp = filterProperties(filter, temp);
    temp = sortProperties(sort || 'latest', temp);
    return temp;
  });

  private queryParams = toSignal(this.activatedRoute.queryParams);

  constructor(
    private activatedRoute: ActivatedRoute,
    private propertiesService: PropertiesService
  ) {}

  ngOnInit(): void {
    if (!this.propertiesService.properties.length) {
      this.loadMoreProperty();
    }
  }

  public loadMoreProperty = debounce(async () => {
    this.propertiesService.isLoading.set(true);
    const { sort, filter, search } = this.queryParams();
    const res = await this.propertiesService.fetchProperties(sort, filter, search);
    if (res.status !== 200) return;
    const { items, hasMore, ...lastFetched } = res.data;
    this.propertiesService.setPropertiesState(items, lastFetched);
    await this.infinityScroll.complete();
    this.propertiesService.isLoading.set(false);
    if (!hasMore) {
      this.disableInfinitScroll.set(true);
    }
    console.log('New items loaded...', res.data);
  }, 1000);
}
